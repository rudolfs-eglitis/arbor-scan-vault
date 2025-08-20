-- Phase 1: Critical Data Access Control Fixes

-- Update trees table RLS policies
DROP POLICY IF EXISTS "Authenticated users can create trees" ON public.trees;
DROP POLICY IF EXISTS "Authenticated users can view trees" ON public.trees;
DROP POLICY IF EXISTS "Users can update trees they created" ON public.trees;

-- More restrictive tree access policies
CREATE POLICY "Users can create trees" 
ON public.trees 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND created_by = auth.uid());

CREATE POLICY "Users can view trees they created or admins can view all" 
ON public.trees 
FOR SELECT 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'qtra_arborist'::app_role)
);

CREATE POLICY "Users can update trees they created or admins can update all" 
ON public.trees 
FOR UPDATE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can delete trees they created or admins can delete all" 
ON public.trees 
FOR DELETE 
USING (
  auth.uid() = created_by OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Update assessments table RLS policies
DROP POLICY IF EXISTS "Authenticated users can create assessments" ON public.assessments;
DROP POLICY IF EXISTS "Authenticated users can view assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can update assessments they created" ON public.assessments;

-- More restrictive assessment access policies
CREATE POLICY "Users can create assessments for trees they have access to" 
ON public.assessments 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  assessor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.trees t 
    WHERE t.id = assessments.tree_id AND 
    (t.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role))
  )
);

CREATE POLICY "Users can view assessments they created or for trees they have access to" 
ON public.assessments 
FOR SELECT 
USING (
  auth.uid() = assessor_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  (has_role(auth.uid(), 'qtra_arborist'::app_role) AND 
   EXISTS (SELECT 1 FROM public.trees t WHERE t.id = assessments.tree_id))
);

CREATE POLICY "Users can update assessments they created" 
ON public.assessments 
FOR UPDATE 
USING (auth.uid() = assessor_id OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete assessments they created or admins can delete all" 
ON public.assessments 
FOR DELETE 
USING (auth.uid() = assessor_id OR has_role(auth.uid(), 'admin'::app_role));

-- Update tree_photos RLS policies
DROP POLICY IF EXISTS "Authenticated users can create tree photos" ON public.tree_photos;
DROP POLICY IF EXISTS "Authenticated users can view tree photos" ON public.tree_photos;

CREATE POLICY "Users can upload photos for trees they have access to" 
ON public.tree_photos 
FOR INSERT 
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  uploaded_by = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.trees t 
    WHERE t.id = tree_photos.tree_id AND 
    (t.created_by = auth.uid() OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role))
  )
);

CREATE POLICY "Users can view photos for trees they have access to" 
ON public.tree_photos 
FOR SELECT 
USING (
  auth.uid() = uploaded_by OR 
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.trees t 
    WHERE t.id = tree_photos.tree_id AND 
    (t.created_by = auth.uid() OR has_role(auth.uid(), 'qtra_arborist'::app_role))
  )
);

CREATE POLICY "Users can update photos they uploaded or admins can update all" 
ON public.tree_photos 
FOR UPDATE 
USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can delete photos they uploaded or admins can delete all" 
ON public.tree_photos 
FOR DELETE 
USING (auth.uid() = uploaded_by OR has_role(auth.uid(), 'admin'::app_role));

-- Update profiles RLS policies for enhanced privacy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "QTRA arborists can view basic profile info of tree creators" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'qtra_arborist'::app_role) AND
  EXISTS (
    SELECT 1 FROM public.trees t 
    WHERE t.created_by = profiles.id
  )
);

-- Add location-specific access control for sensitive GPS data
-- Create a view for public tree information (without precise coordinates)
CREATE OR REPLACE VIEW public.trees_public AS
SELECT 
  id,
  tree_number,
  species_id,
  height_m,
  dbh_cm,
  crown_spread_m,
  age_estimate,
  created_by,
  created_at,
  updated_at,
  -- Generalized location (no precise coordinates for non-authorized users)
  CASE 
    WHEN auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role)
    THEN latitude
    ELSE NULL 
  END as latitude,
  CASE 
    WHEN auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'qtra_arborist'::app_role)
    THEN longitude
    ELSE NULL 
  END as longitude,
  -- Always show general location info
  location_description,
  site_conditions,
  ownership,
  protected_status,
  notes
FROM public.trees;

-- Grant access to the public view
GRANT SELECT ON public.trees_public TO authenticated;

-- Update database functions with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.role
  FROM public.user_roles ur
  WHERE ur.user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;