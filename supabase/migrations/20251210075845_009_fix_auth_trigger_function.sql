/*
  # Fix Authentication Trigger Function
  
  The handle_new_user() trigger function may be causing authentication issues.
  This migration makes the function more robust by:
  
  1. Using proper error handling
  2. Ensuring the function can access roles table without RLS issues
  3. Adding a fallback if role lookup fails
  
  Changes:
  - Recreate the trigger function with better error handling
  - Ensure it works even if roles table has issues
*/

-- Drop and recreate the function with better handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  default_role_id uuid;
BEGIN
  -- Try to get the viewer role, with fallback to null
  BEGIN
    SELECT id INTO default_role_id FROM public.roles WHERE name = 'viewer' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    default_role_id := NULL;
  END;
  
  -- Insert profile even if role lookup fails
  INSERT INTO public.profiles (id, email, full_name, role_id, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    default_role_id,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log error but don't prevent user creation
  RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
