/*
  # WhatsAppX Core Schema - Part 1: Roles and Permissions
  
  1. New Tables
    - `roles` - System roles (admin, operator, viewer)
    - `permissions` - Granular permissions
    - `role_permissions` - Join table
  
  2. Security
    - Enable RLS on all tables
    - Basic read policies for authenticated users
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read roles"
  ON roles FOR SELECT
  TO authenticated
  USING (true);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  resource text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Create role_permissions join table
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read role_permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (true);

-- Insert default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full access to all features and settings'),
  ('operator', 'Can manage instances, chats, broadcasts, and contacts'),
  ('viewer', 'Read-only access to analytics and conversations')
ON CONFLICT (name) DO NOTHING;

-- Insert permissions (~35 granular permissions across 7 resources)
INSERT INTO permissions (name, description, resource) VALUES
  ('instance.read', 'View instances', 'instance'),
  ('instance.write', 'Create and edit instances', 'instance'),
  ('instance.delete', 'Delete instances', 'instance'),
  ('instance.connect', 'Connect/disconnect instances', 'instance'),
  ('instance.configure', 'Configure instance settings', 'instance'),
  ('chat.read', 'View conversations', 'chat'),
  ('chat.write', 'Send messages', 'chat'),
  ('chat.delete', 'Delete messages', 'chat'),
  ('contact.read', 'View contacts', 'contact'),
  ('contact.write', 'Create and edit contacts', 'contact'),
  ('contact.delete', 'Delete contacts', 'contact'),
  ('contact.export', 'Export contacts', 'contact'),
  ('contact.import', 'Import contacts', 'contact'),
  ('broadcast.read', 'View broadcasts', 'broadcast'),
  ('broadcast.create', 'Create broadcasts', 'broadcast'),
  ('broadcast.edit', 'Edit broadcasts', 'broadcast'),
  ('broadcast.delete', 'Delete broadcasts', 'broadcast'),
  ('broadcast.execute', 'Execute broadcasts', 'broadcast'),
  ('agent.read', 'View AI agents', 'agent'),
  ('agent.write', 'Create and edit AI agents', 'agent'),
  ('agent.delete', 'Delete AI agents', 'agent'),
  ('agent.execute', 'Execute AI agents', 'agent'),
  ('user.read', 'View users', 'user'),
  ('user.write', 'Create and edit users', 'user'),
  ('user.delete', 'Delete users', 'user'),
  ('user.manage_roles', 'Manage user roles', 'user'),
  ('settings.read', 'View settings', 'settings'),
  ('settings.write', 'Edit settings', 'settings'),
  ('webhook.read', 'View webhooks', 'webhook'),
  ('webhook.write', 'Manage webhooks', 'webhook'),
  ('analytics.read', 'View analytics', 'analytics'),
  ('analytics.export', 'Export analytics', 'analytics'),
  ('audit.read', 'View audit logs', 'audit'),
  ('billing.read', 'View billing information', 'billing'),
  ('billing.write', 'Manage billing', 'billing')
ON CONFLICT (name) DO NOTHING;

-- Assign all permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- Assign operator permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'operator' AND p.name IN (
  'instance.read', 'instance.write', 'instance.connect', 'instance.configure',
  'chat.read', 'chat.write',
  'contact.read', 'contact.write', 'contact.delete',
  'broadcast.read', 'broadcast.create', 'broadcast.edit', 'broadcast.execute',
  'agent.read', 'agent.execute',
  'analytics.read'
)
ON CONFLICT DO NOTHING;

-- Assign viewer permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.name IN (
  'instance.read', 'chat.read', 'contact.read', 'broadcast.read', 'agent.read', 'analytics.read'
)
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);