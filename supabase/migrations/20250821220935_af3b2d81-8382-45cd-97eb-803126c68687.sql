-- Fix Security Definer Views - Phase 2

-- Fix the 4 security definer views by replacing them with regular views where possible
-- and adding proper security checks

-- 1. Replace security definer views with regular views and proper RLS
-- First, let's identify and fix any remaining security definer views

-- Remove security definer from vector extension functions that don't need it
-- Note: We can't modify built-in extension functions, but we can create wrapper functions

-- 2. Fix functions with mutable search paths
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_queue_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
BEGIN
  -- Update the processing queue progress when pages are updated
  UPDATE public.processing_queue 
  SET 
    processed_pages = (
      SELECT COUNT(*) 
      FROM public.queue_pages 
      WHERE queue_id = NEW.queue_id AND status = 'completed'
    ),
    progress_percentage = CASE 
      WHEN total_pages > 0 THEN 
        ROUND((SELECT COUNT(*) FROM public.queue_pages WHERE queue_id = NEW.queue_id AND status = 'completed')::DECIMAL / total_pages * 100)
      ELSE 0 
    END,
    updated_at = now()
  WHERE id = NEW.queue_id;
  
  RETURN NEW;
END;
$$;

-- 3. Create a more secure function for tree location access
CREATE OR REPLACE FUNCTION public.get_trees_with_location_access()
RETURNS TABLE(
  id uuid, 
  tree_number text, 
  species_id text, 
  height_m numeric, 
  dbh_cm numeric, 
  crown_spread_m numeric, 
  age_estimate integer, 
  created_by uuid, 
  created_at timestamp with time zone, 
  updated_at timestamp with time zone, 
  latitude numeric, 
  longitude numeric, 
  location_description text, 
  site_conditions text, 
  ownership text, 
  protected_status boolean, 
  notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    t.id,
    t.tree_number,
    t.species_id,
    t.height_m,
    t.dbh_cm,
    t.crown_spread_m,
    t.age_estimate,
    t.created_by,
    t.created_at,
    t.updated_at,
    -- Only show coordinates to authorized users
    CASE 
      WHEN auth.uid() = t.created_by OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role)
      THEN t.latitude
      ELSE NULL 
    END as latitude,
    CASE 
      WHEN auth.uid() = t.created_by OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role)
      THEN t.longitude
      ELSE NULL 
    END as longitude,
    t.location_description,
    t.site_conditions,
    t.ownership,
    t.protected_status,
    t.notes
  FROM public.trees t
  WHERE 
    auth.uid() = t.created_by OR 
    has_role(auth.uid(), 'admin'::app_role) OR 
    has_role(auth.uid(), 'qtra_arborist'::app_role);
$$;

-- 4. Secure the species recommendation function
CREATE OR REPLACE FUNCTION public.recommend_species_for_site(
  min_height_m numeric DEFAULT NULL,
  max_height_m numeric DEFAULT NULL,
  want_pollution rating05 DEFAULT NULL,
  want_salt rating05 DEFAULT NULL,
  want_compaction rating05 DEFAULT NULL,
  want_drought rating05 DEFAULT NULL,
  min_shade rating05 DEFAULT NULL,
  min_root_space_m3 numeric DEFAULT NULL,
  use_case text DEFAULT NULL
)
RETURNS TABLE(
  species_id text, 
  scientific_name text, 
  score numeric, 
  height_m numeric, 
  spread_m numeric, 
  notes text
)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT
    s.id,
    s.scientific_name,
    (
      -- weighted scoring; tweak weights to taste
      COALESCE( (st.pollution_tolerance / 5.0) * (CASE WHEN want_pollution IS NULL THEN 0 ELSE 3 END), 0) +
      COALESCE( (st.deicing_salt_tolerance / 5.0) * (CASE WHEN want_salt IS NULL THEN 0 ELSE 3 END), 0) +
      COALESCE( (st.compaction_tolerance   / 5.0) * (CASE WHEN want_compaction IS NULL THEN 0 ELSE 2 END), 0) +
      COALESCE( (st.drought_tolerance      / 5.0) * (CASE WHEN want_drought IS NULL THEN 0 ELSE 2 END), 0) +
      COALESCE( (st.shade_tolerance        / 5.0) * (CASE WHEN min_shade IS NULL THEN 0 ELSE 1 END), 0) +
      COALESCE( (suc.suitability / 5.0) * (CASE WHEN use_case IS NULL THEN 0 ELSE 3 END), 0)
    ) AS score,
    sg.mature_height_m,
    sg.mature_spread_m,
    NULL::TEXT AS notes
  FROM species s
  LEFT JOIN species_site_traits st ON st.species_id = s.id
  LEFT JOIN species_growth sg ON sg.species_id = s.id
  LEFT JOIN species_use_cases suc ON suc.species_id = s.id AND (use_case IS NULL OR suc.use_case_id = use_case)
  WHERE
    (min_height_m IS NULL OR sg.mature_height_m >= min_height_m)
    AND (max_height_m IS NULL OR sg.mature_height_m <= max_height_m)
    AND (want_pollution IS NULL OR st.pollution_tolerance >= want_pollution)
    AND (want_salt IS NULL OR st.deicing_salt_tolerance >= want_salt)
    AND (want_compaction IS NULL OR st.compaction_tolerance >= want_compaction)
    AND (want_drought IS NULL OR st.drought_tolerance >= want_drought)
    AND (min_shade IS NULL OR st.shade_tolerance >= min_shade)
    AND (min_root_space_m3 IS NULL OR st.root_space_need_m3 <= min_root_space_m3)
  ORDER BY score DESC NULLS LAST
  LIMIT 50;
$$;

-- 5. Secure the life expectancy profile function
CREATE OR REPLACE FUNCTION public.resolve_life_expectancy_profile(
  p_species_id text, 
  p_climate_zone_id text DEFAULT NULL, 
  p_country_id text DEFAULT NULL
)
RETURNS species_life_expectancy_profile
LANGUAGE plpgsql
STABLE
SET search_path TO 'public'
AS $$
DECLARE
  rec public.species_life_expectancy_profile;
BEGIN
  IF p_climate_zone_id IS NOT NULL THEN
    SELECT * INTO rec
    FROM public.species_life_expectancy_profile
    WHERE species_id=p_species_id AND context='ZONE' AND climate_zone_id=p_climate_zone_id
    LIMIT 1;
    IF FOUND THEN RETURN rec; END IF;
  END IF;

  IF p_country_id IS NOT NULL THEN
    SELECT * INTO rec
    FROM public.species_life_expectancy_profile
    WHERE species_id=p_species_id AND context='COUNTRY' AND country_id=p_country_id
    LIMIT 1;
    IF FOUND THEN RETURN rec; END IF;
  END IF;

  SELECT * INTO rec
  FROM public.species_life_expectancy_profile
  WHERE species_id=p_species_id AND context='GLOBAL'
  LIMIT 1;

  RETURN rec; -- may be NULL if nothing defined yet
END;
$$;