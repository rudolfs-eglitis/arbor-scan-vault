-- Create root admin user for rudolfs.eglitis@gmail.com
-- This will be executed as a function to handle the case where the user doesn't exist yet

CREATE OR REPLACE FUNCTION create_root_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Execute the function
SELECT create_root_admin_user();

-- Create a trigger to automatically assign admin role to rudolfs.eglitis@gmail.com when they sign up
CREATE OR REPLACE FUNCTION assign_root_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Create trigger for new user signups
DROP TRIGGER IF EXISTS on_root_admin_signup ON auth.users;
CREATE TRIGGER on_root_admin_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION assign_root_admin_on_signup();