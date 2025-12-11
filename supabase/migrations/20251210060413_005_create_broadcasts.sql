/*
  # WhatsAppX Schema - Part 5: Broadcasting
  
  1. New Tables
    - `broadcasts` - Bulk message campaigns
    - `broadcast_recipients` - Recipients for each broadcast
    - `broadcast_logs` - Per-recipient delivery logs
  
  2. Security
    - Enable RLS on all tables
    - Users access only their own broadcasts
*/

-- Create broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instance_configs(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  message_type text DEFAULT 'text',
  message_content text,
  media_url text,
  media_caption text,
  recipient_type text DEFAULT 'contacts' CHECK (recipient_type IN ('contacts', 'tags', 'groups', 'custom')),
  recipient_filter jsonb DEFAULT '{}'::jsonb,
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own broadcasts"
  ON broadcasts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create broadcast_recipients table
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  whatsapp_id text NOT NULL,
  phone_number text,
  name text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own broadcast recipients"
  ON broadcast_recipients FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM broadcasts b
      WHERE b.id = broadcast_id AND b.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM broadcasts b
      WHERE b.id = broadcast_id AND b.user_id = auth.uid()
    )
  );

-- Create broadcast_logs table
CREATE TABLE IF NOT EXISTS broadcast_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  broadcast_id uuid NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES broadcast_recipients(id) ON DELETE SET NULL,
  whatsapp_id text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  message_id text,
  error_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broadcast_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own broadcast logs"
  ON broadcast_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM broadcasts b
      WHERE b.id = broadcast_id AND b.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own broadcast logs"
  ON broadcast_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM broadcasts b
      WHERE b.id = broadcast_id AND b.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON broadcasts(user_id);
CREATE INDEX IF NOT EXISTS idx_broadcasts_status ON broadcasts(status);
CREATE INDEX IF NOT EXISTS idx_broadcasts_scheduled ON broadcasts(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_broadcast_id ON broadcast_recipients(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_broadcast_id ON broadcast_logs(broadcast_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_logs_status ON broadcast_logs(status);