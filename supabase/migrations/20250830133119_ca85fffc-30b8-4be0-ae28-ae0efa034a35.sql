-- Fix security vulnerability: Restrict profile access to prevent email harvesting
-- Remove overly permissive policies and create more secure ones

-- Drop existing policies that allow too broad access
DROP POLICY IF EXISTS "QTRA arborists can view limited profile info for active assessm" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create more secure policies with proper access control
-- 1. Users can only view and update their own profile
CREATE POLICY "Users can view own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile only" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 2. Admins can view all profiles (needed for user management functionality)
-- This is necessary for the UserManagement component but now properly restricted to admins only
CREATE POLICY "Admins can view all profiles for management" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role)
);

-- 3. Create a secure function for QTRA arborists to get minimal profile info
-- This returns only display_name, not email addresses
CREATE OR REPLACE FUNCTION public.get_assessor_profile(profile_user_id uuid)
RETURNS TABLE(id uuid, display_name text) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name
  FROM public.profiles p
  WHERE p.id = profile_user_id
    AND (
      -- Only show if the requesting user is admin or has assessment relationship
      has_role(auth.uid(), 'admin'::app_role) OR
      (
        has_role(auth.uid(), 'qtra_arborist'::app_role) AND
        EXISTS (
          SELECT 1 
          FROM assessments a
          JOIN trees t ON t.id = a.tree_id
          WHERE t.created_by = profile_user_id
          AND a.assessor_id = auth.uid()
          AND a.assessment_date >= CURRENT_DATE - INTERVAL '30 days'
        )
      )
    );
$$;

-- Add audit logging for admin profile access
-- This creates a more secure audit trail when admins access profiles
CREATE OR REPLACE FUNCTION public.audit_admin_profile_access(target_profile_id uuid, target_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only log if current user is admin accessing someone else's profile
  IF auth.uid() != target_profile_id AND has_role(auth.uid(), 'admin'::app_role) THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      details
    ) VALUES (
      auth.uid(),
      'admin_profile_access',
      'profiles',
      target_profile_id,
      jsonb_build_object(
        'accessed_user_email', target_email,
        'access_reason', 'user_management',
        'timestamp', NOW()
      )
    );
  END IF;
END;
$$;