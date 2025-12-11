/*
  # WhatsAppX Schema - Part 4: Contacts and Conversations
  
  1. New Tables
    - `contacts` - Contact CRM
    - `contact_tags` - Tags for contacts
    - `contact_tag_assignments` - Join table
    - `conversations` - Chat conversations
    - `messages` - Message history cache
  
  2. Security
    - Enable RLS on all tables
    - Users access only their own data
*/

-- Create contact_tags table
CREATE TABLE IF NOT EXISTS contact_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, name)
);

ALTER TABLE contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tags"
  ON contact_tags FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES instance_configs(id) ON DELETE SET NULL,
  whatsapp_id text NOT NULL,
  phone_number text,
  name text,
  push_name text,
  profile_picture_url text,
  notes text,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  is_group boolean DEFAULT false,
  group_metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, whatsapp_id)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own contacts"
  ON contacts FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create contact_tag_assignments join table
CREATE TABLE IF NOT EXISTS contact_tag_assignments (
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES contact_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (contact_id, tag_id)
);

ALTER TABLE contact_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tag assignments"
  ON contact_tag_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contacts c
      WHERE c.id = contact_id AND c.user_id = auth.uid()
    )
  );

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES instance_configs(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  remote_jid text NOT NULL,
  is_group boolean DEFAULT false,
  unread_count integer DEFAULT 0,
  last_message_at timestamptz,
  last_message_preview text,
  is_archived boolean DEFAULT false,
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own conversations"
  ON conversations FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create messages table (cache from WhatsApp)
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  instance_id uuid REFERENCES instance_configs(id) ON DELETE CASCADE,
  message_id text NOT NULL,
  remote_jid text NOT NULL,
  from_me boolean DEFAULT false,
  message_type text DEFAULT 'text',
  content text,
  media_url text,
  media_mime_type text,
  media_caption text,
  quoted_message_id text,
  status text DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, message_id)
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own messages"
  ON messages FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_id ON contacts(whatsapp_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_instance_id ON conversations(instance_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_content_search ON messages USING gin(to_tsvector('english', content));