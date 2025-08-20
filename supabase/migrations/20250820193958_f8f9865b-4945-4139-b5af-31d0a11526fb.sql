-- Fix the remaining function missing search_path
CREATE OR REPLACE FUNCTION public.recommend_species_for_site(min_height_m numeric DEFAULT NULL::numeric, max_height_m numeric DEFAULT NULL::numeric, want_pollution rating05 DEFAULT NULL::smallint, want_salt rating05 DEFAULT NULL::smallint, want_compaction rating05 DEFAULT NULL::smallint, want_drought rating05 DEFAULT NULL::smallint, min_shade rating05 DEFAULT NULL::smallint, min_root_space_m3 numeric DEFAULT NULL::numeric, use_case text DEFAULT NULL::text)
RETURNS TABLE(species_id text, scientific_name text, score numeric, height_m numeric, spread_m numeric, notes text)
LANGUAGE sql
STABLE
SET search_path = public
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