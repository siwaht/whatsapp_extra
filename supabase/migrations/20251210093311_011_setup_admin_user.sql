/*
  # Setup Admin User

  This migration ensures that when a user with email cc@siwaht.com
  signs up, they will be assigned the admin role.

  1. Creates a trigger to auto-assign admin role to the specific email
  2. Updates any existing profile with this email to have admin role
*/

CREATE OR REPLACE FUNCTION assign_admin_role()
RETURNS trigger
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_role_id uuid;
BEGIN
  IF NEW.email = 'cc@siwaht.com' THEN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
    
    IF admin_role_id IS NOT NULL THEN
      UPDATE profiles 
      SET role_id = admin_role_id, full_name = COALESCE(full_name, 'Admin User')
      WHERE id = NEW.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_created_assign_admin ON profiles;

CREATE TRIGGER on_profile_created_assign_admin
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION assign_admin_role();

DO $$
DECLARE
  admin_role_id uuid;
BEGIN
  SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' LIMIT 1;
  
  IF admin_role_id IS NOT NULL THEN
    UPDATE profiles 
    SET role_id = admin_role_id, full_name = COALESCE(full_name, 'Admin User')
    WHERE email = 'cc@siwaht.com';
  END IF;
END $$;