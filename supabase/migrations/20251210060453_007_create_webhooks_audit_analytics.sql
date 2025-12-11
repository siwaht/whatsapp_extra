/*
  # WhatsAppX Schema - Part 7: Webhooks, Audit, Analytics
  
  1. New Tables
    - `webhook_events` - Raw webhook payloads from Evolution API
    - `audit_logs` - Track CRUD operations, logins, role changes
    - `message_stats` - Aggregated stats for analytics
    - `subscriptions` - Stripe subscription data
  
  2. Security
    - Enable RLS on all tables
    - Users access only their own data
*/

-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  instance_id uuid REFERENCES instance_configs(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook events"
  ON webhook_events FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN roles r ON p.role_id = r.id
      WHERE p.id = auth.uid() AND r.name = 'admin'
    )
  );

-- Create message_stats table (daily aggregates)
CREATE TABLE IF NOT EXISTS message_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES instance_configs(id) ON DELETE CASCADE,
  stat_date date NOT NULL,
  messages_sent integer DEFAULT 0,
  messages_received integer DEFAULT 0,
  messages_delivered integer DEFAULT 0,
  messages_read integer DEFAULT 0,
  messages_failed integer DEFAULT 0,
  unique_contacts integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, instance_id, stat_date)
);

ALTER TABLE message_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own stats"
  ON message_stats FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create subscriptions table (Stripe)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan_id text,
  plan_name text,
  status text DEFAULT 'inactive' CHECK (status IN ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON subscriptions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own subscription"
  ON subscriptions FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create rate_limit_entries table
CREATE TABLE IF NOT EXISTS rate_limit_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  request_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rate_limit_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own rate limits"
  ON rate_limit_entries FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_user_id ON webhook_events(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_instance_id ON webhook_events(instance_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_stats_user_date ON message_stats(user_id, stat_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);