/*
  # Add Evolution API URL to Instance Configs
  
  1. Changes
    - Add `evolution_api_url` column to `instance_configs` table
    - This allows each instance to store its Evolution API manager URL
    - Useful for quick access to configuration interface
  
  2. Notes
    - Column is nullable as existing instances won't have this field
    - Future instances will automatically populate this on creation
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'instance_configs' AND column_name = 'evolution_api_url'
  ) THEN
    ALTER TABLE instance_configs ADD COLUMN evolution_api_url text;
  END IF;
END $$;