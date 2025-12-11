/*
  # Add webhook_configs table

  1. New Tables
    - `webhook_configs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `instance_id` (uuid, references instance_configs)
      - `name` (text)
      - `url` (text)
      - `events` (jsonb array)
      - `headers` (jsonb)
      - `is_active` (boolean)
      - `retry_count` (integer)
      - `timeout_ms` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `webhook_configs` table
    - Add policy for users to manage their own webhook configs
*/

CREATE TABLE IF NOT EXISTS webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instance_configs(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  events jsonb DEFAULT '["message"]'::jsonb,
  headers jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  retry_count integer DEFAULT 5,
  timeout_ms integer DEFAULT 30000,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook configs"
  ON webhook_configs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own webhook configs"
  ON webhook_configs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own webhook configs"
  ON webhook_configs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own webhook configs"
  ON webhook_configs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_webhook_configs_user_id ON webhook_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_instance_id ON webhook_configs(instance_id);
