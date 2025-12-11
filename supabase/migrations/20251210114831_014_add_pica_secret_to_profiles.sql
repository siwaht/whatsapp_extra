/*
  # Add Pica Secret Key to Profiles
  
  1. Changes
    - Add `pica_secret_key` column to `profiles` table
    - This allows users to store their Pica OS secret key for AI integrations
  
  2. Notes
    - Column is nullable as not all users may use Pica OS
    - Stored securely in the database
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pica_secret_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pica_secret_key text;
  END IF;
END $$;