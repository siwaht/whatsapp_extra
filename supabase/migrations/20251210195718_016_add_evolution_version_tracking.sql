/*
  # Add Evolution API Version Tracking

  1. New Tables
    - `evolution_api_status`
      - `id` (uuid, primary key) - Unique identifier
      - `current_version` (text) - Currently installed Evolution API version
      - `latest_version` (text, nullable) - Latest available version from Docker Hub
      - `last_check_at` (timestamptz, nullable) - Last time version check was performed
      - `update_available` (boolean) - Whether an update is available
      - `auto_update_enabled` (boolean) - Whether automatic updates are enabled
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

    - `evolution_api_update_history`
      - `id` (uuid, primary key) - Unique identifier
      - `from_version` (text) - Version before update
      - `to_version` (text) - Version after update
      - `status` (text) - Update status: pending, in_progress, completed, failed, rolled_back
      - `started_at` (timestamptz) - When update started
      - `completed_at` (timestamptz, nullable) - When update completed or failed
      - `error_message` (text, nullable) - Error message if update failed
      - `initiated_by` (uuid, nullable) - User who initiated the update
      - `created_at` (timestamptz) - Record creation timestamp

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read status
    - Add policies for admin users to manage updates

  3. Indexes
    - Add index on update_history for efficient querying

  4. Functions
    - Function to automatically update the updated_at timestamp
*/

-- Create evolution_api_status table
CREATE TABLE IF NOT EXISTS evolution_api_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  current_version text NOT NULL DEFAULT 'v2.1.1',
  latest_version text,
  last_check_at timestamptz,
  update_available boolean DEFAULT false,
  auto_update_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create evolution_api_update_history table
CREATE TABLE IF NOT EXISTS evolution_api_update_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version text NOT NULL,
  to_version text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'rolled_back')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  initiated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Create index for update history queries
CREATE INDEX IF NOT EXISTS idx_evolution_update_history_status
  ON evolution_api_update_history(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_evolution_update_history_user
  ON evolution_api_update_history(initiated_by);

-- Enable Row Level Security
ALTER TABLE evolution_api_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_api_update_history ENABLE ROW LEVEL SECURITY;

-- Policies for evolution_api_status
-- All authenticated users can read the status
CREATE POLICY "Authenticated users can view Evolution API status"
  ON evolution_api_status
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can update the status
CREATE POLICY "Admin users can update Evolution API status"
  ON evolution_api_status
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Only admins can insert status records
CREATE POLICY "Admin users can insert Evolution API status"
  ON evolution_api_status
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Policies for evolution_api_update_history
-- All authenticated users can read update history
CREATE POLICY "Authenticated users can view update history"
  ON evolution_api_update_history
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert update history records
CREATE POLICY "Admin users can insert update history"
  ON evolution_api_update_history
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Only admins can update history records
CREATE POLICY "Admin users can update update history"
  ON evolution_api_update_history
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_evolution_api_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS evolution_api_status_updated_at ON evolution_api_status;
CREATE TRIGGER evolution_api_status_updated_at
  BEFORE UPDATE ON evolution_api_status
  FOR EACH ROW
  EXECUTE FUNCTION update_evolution_api_status_updated_at();

-- Insert initial status record (only if none exists)
INSERT INTO evolution_api_status (current_version, latest_version, update_available)
SELECT 'v2.1.1', 'v2.1.1', false
WHERE NOT EXISTS (SELECT 1 FROM evolution_api_status);