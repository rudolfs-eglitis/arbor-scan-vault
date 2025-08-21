-- Critical Security Fixes - Phase 1

-- 1. Create a public profiles table with limited data for QTRA arborists
CREATE TABLE IF NOT EXISTS public.user_public_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE public.user_public_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for public profiles
CREATE POLICY "Users can view all public profiles" 
ON public.user_public_profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own public profile" 
ON public.user_public_profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own public profile" 
ON public.user_public_profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);

-- 2. Strengthen role escalation prevention
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Prevent users from giving themselves admin roles
  IF NEW.user_id = auth.uid() AND NEW.role = 'admin' THEN
    RAISE EXCEPTION 'Users cannot assign admin role to themselves';
  END IF;
  
  -- Prevent users from giving themselves qtra_arborist roles without approval
  IF NEW.user_id = auth.uid() AND NEW.role = 'qtra_arborist' AND OLD.role IS NULL THEN
    RAISE EXCEPTION 'QTRA arborist role requires admin approval';
  END IF;
  
  -- Only allow admins to change other users' roles
  IF NEW.user_id != auth.uid() AND NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change other users roles';
  END IF;
  
  -- Log role changes with more details
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    'role_change',
    'user_roles',
    NEW.user_id,
    jsonb_build_object(
      'old_role', COALESCE(OLD.role::text, 'none'),
      'new_role', NEW.role::text,
      'changed_by', auth.uid(),
      'target_user', NEW.user_id,
      'timestamp', NOW()
    )
  );
  
  RETURN NEW;
END;
$$;

-- 3. Update the QTRA arborist profile access function to be more secure
CREATE OR REPLACE FUNCTION public.qtra_arborist_has_assessment_access(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM assessments a
    JOIN trees t ON t.id = a.tree_id
    WHERE t.created_by = profile_user_id
    AND a.assessor_id = auth.uid()
    AND (a.status IN ('draft', 'completed') OR a.assessment_date >= CURRENT_DATE - INTERVAL '30 days')
    AND has_role(auth.uid(), 'qtra_arborist'::app_role)
  );
$$;

-- 4. Update profiles RLS policies to be more restrictive
DROP POLICY IF EXISTS "QTRA arborists can view limited profile info for active assessm" ON public.profiles;

CREATE POLICY "QTRA arborists can view limited profile info for active assessments" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'qtra_arborist'::app_role) 
  AND qtra_arborist_has_assessment_access(id)
  AND auth.uid() != id  -- Prevent viewing own profile through this policy
);

-- 5. Add trigger to sync public profiles with main profiles
CREATE OR REPLACE FUNCTION public.sync_public_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert or update public profile when main profile changes
  INSERT INTO public.user_public_profiles (id, display_name)
  VALUES (NEW.id, NEW.display_name)
  ON CONFLICT (id) 
  DO UPDATE SET 
    display_name = NEW.display_name,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_public_profile_trigger
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_public_profile();

-- 6. Populate existing public profiles
INSERT INTO public.user_public_profiles (id, display_name)
SELECT id, display_name 
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- 7. Add additional security for user_roles table
CREATE POLICY "Users cannot delete admin roles" 
ON public.user_roles 
FOR DELETE 
USING (
  role != 'admin'::app_role 
  OR has_role(auth.uid(), 'admin'::app_role)
);

-- 8. Add data retention function for auth_attempts
CREATE OR REPLACE FUNCTION public.cleanup_old_auth_attempts()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.auth_attempts 
  WHERE attempt_time < now() - INTERVAL '30 days';
$$;