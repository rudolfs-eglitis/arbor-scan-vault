-- Fix security linter issues

-- Fix functions that don't have search_path set properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', split_part(NEW.email, '@', 1))
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_root_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If this is the root admin email, assign admin role
  IF NEW.email = 'rudolfs.eglitis@gmail.com' THEN
    -- Insert admin role (the handle_new_user function will have already created the user role)
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_root_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Check if user exists in auth.users by email
  SELECT * INTO user_record 
  FROM auth.users 
  WHERE email = 'rudolfs.eglitis@gmail.com' 
  LIMIT 1;
  
  -- If user exists, ensure they have admin role
  IF FOUND THEN
    -- Remove any existing roles for this user to avoid duplicates
    DELETE FROM public.user_roles WHERE user_id = user_record.id;
    
    -- Add admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (user_record.id, 'admin');
    
    -- Update or create profile
    INSERT INTO public.profiles (id, email, display_name)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data ->> 'display_name', 'Root Admin')
    )
    ON CONFLICT (id) DO UPDATE SET
      display_name = COALESCE(EXCLUDED.display_name, profiles.display_name);
      
    RAISE NOTICE 'Root admin user configured for %', user_record.email;
  ELSE
    RAISE NOTICE 'User % not found in auth.users. They will be assigned admin role when they sign up.', 'rudolfs.eglitis@gmail.com';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_queue_progress()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_life_expectancy_profile(p_species_id text, p_climate_zone_id text DEFAULT NULL::text, p_country_id text DEFAULT NULL::text)
RETURNS species_life_expectancy_profile
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.add_enum_value_if_not_exists(enum_type text, new_value text)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = new_value 
        AND enumtypid = enum_type::regtype
    ) THEN
        EXECUTE format('ALTER TYPE %I ADD VALUE %L', enum_type, new_value);
    END IF;
END;
$$;

-- Replace the view with a regular function for better security
DROP VIEW IF EXISTS public.trees_public;

CREATE OR REPLACE FUNCTION public.get_trees_with_location_access()
RETURNS TABLE (
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
SECURITY DEFINER
SET search_path = public
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