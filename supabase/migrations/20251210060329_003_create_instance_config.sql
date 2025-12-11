/*
  # WhatsAppX Schema - Part 3: Instance Configuration
  
  1. New Tables
    - `instance_configs` - WhatsApp instance configurations
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `instance_name` (text)
      - `instance_id` (text) - Evolution API instance ID
      - `status` (text) - open, connecting, closed, error
      - `phone_number` (text)
      - `webhook_url` (text)
      - `webhook_events` (jsonb)
      - `proxy_settings` (jsonb)
      - `settings` (jsonb) - additional settings
  
  2. Security
    - Enable RLS
    - Users can only access their own instances
*/

-- Create instance_configs table
CREATE TABLE IF NOT EXISTS instance_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_name text NOT NULL,
  instance_id text,
  status text DEFAULT 'closed' CHECK (status IN ('open', 'connecting', 'closed', 'error')),
  phone_number text,
  phone_label text,
  webhook_url text,
  webhook_events jsonb DEFAULT '[]'::jsonb,
  proxy_settings jsonb DEFAULT '{}'::jsonb,
  settings jsonb DEFAULT '{}'::jsonb,
  last_activity_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE instance_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own instances"
  ON instance_configs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own instances"
  ON instance_configs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own instances"
  ON instance_configs FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own instances"
  ON instance_configs FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instance_configs_user_id ON instance_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_instance_configs_status ON instance_configs(status);
CREATE INDEX IF NOT EXISTS idx_instance_configs_instance_id ON instance_configs(instance_id);