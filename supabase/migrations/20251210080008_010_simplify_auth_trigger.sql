/*
  # Simplify Authentication Trigger
  
  The trigger function may be causing auth failures due to role lookups.
  This migration simplifies it to the bare minimum:
  
  1. Create profile with just the essential fields
  2. Don't look up roles during trigger (causes issues)
  3. Role can be assigned later by admin or defaults to null
  
  Changes:
  - Simplify handle_new_user() to not query roles table
  - Profile is created with null role initially
  - This prevents any RLS or query issues during authentication
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with minimal data, no role lookup
  INSERT INTO public.profiles (id, email, full_name, is_active)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
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

-- Update existing profile to ensure it has the admin role if it doesn't
DO $$
DECLARE
  viewer_role_id uuid;
BEGIN
  SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer' LIMIT 1;
  
  UPDATE profiles 
  SET role_id = viewer_role_id
  WHERE role_id IS NULL AND viewer_role_id IS NOT NULL;
END $$;
