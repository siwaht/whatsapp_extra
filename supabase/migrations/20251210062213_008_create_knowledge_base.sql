/*
  # WhatsAppX Schema - Part 8: Knowledge Base for Vector Search
  
  1. New Tables
    - `knowledge_collections` - Organize documents into collections
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text)
      - `weaviate_class` (text) - Weaviate class name
      - `document_count` (integer)
      - `created_at`, `updated_at` (timestamptz)
    
    - `knowledge_documents` - Track documents stored in Weaviate
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `collection_id` (uuid, references knowledge_collections)
      - `weaviate_id` (text) - Weaviate object UUID
      - `weaviate_class` (text)
      - `title` (text)
      - `content_preview` (text) - First 500 chars of content
      - `metadata` (jsonb) - Tags, mimeType, etc.
      - `has_vector` (boolean) - Whether it has an embedding
      - `created_at`, `updated_at` (timestamptz)
    
    - `agent_knowledge_links` - Link AI agents to knowledge collections
      - `agent_id` (uuid, references ai_agents)
      - `collection_id` (uuid, references knowledge_collections)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on all tables
    - Users can only access their own data
  
  3. New Permissions
    - `knowledge.read`, `knowledge.write`, `knowledge.delete`
*/

-- Create knowledge_collections table
CREATE TABLE IF NOT EXISTS knowledge_collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  weaviate_class text DEFAULT 'Document',
  document_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own collections"
  ON knowledge_collections FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create knowledge_documents table
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  collection_id uuid REFERENCES knowledge_collections(id) ON DELETE SET NULL,
  weaviate_id text,
  weaviate_class text DEFAULT 'Document',
  title text NOT NULL,
  content_preview text,
  metadata jsonb DEFAULT '{}'::jsonb,
  has_vector boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON knowledge_documents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create agent_knowledge_links table
CREATE TABLE IF NOT EXISTS agent_knowledge_links (
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  collection_id uuid NOT NULL REFERENCES knowledge_collections(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (agent_id, collection_id)
);

ALTER TABLE agent_knowledge_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agent knowledge links"
  ON agent_knowledge_links FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ai_agents a
      WHERE a.id = agent_id AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ai_agents a
      WHERE a.id = agent_id AND a.user_id = auth.uid()
    )
  );

-- Add Pica/Weaviate credentials to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pica_secret_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pica_secret_key text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'pica_weaviate_connection_key'
  ) THEN
    ALTER TABLE profiles ADD COLUMN pica_weaviate_connection_key text;
  END IF;
END $$;

-- Add new permissions for knowledge base
INSERT INTO permissions (name, description, resource) VALUES
  ('knowledge.read', 'View knowledge base documents', 'knowledge'),
  ('knowledge.write', 'Create and edit documents', 'knowledge'),
  ('knowledge.delete', 'Delete documents', 'knowledge')
ON CONFLICT (name) DO NOTHING;

-- Assign knowledge permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'admin' AND p.name IN ('knowledge.read', 'knowledge.write', 'knowledge.delete')
ON CONFLICT DO NOTHING;

-- Assign knowledge permissions to operator role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'operator' AND p.name IN ('knowledge.read', 'knowledge.write')
ON CONFLICT DO NOTHING;

-- Assign knowledge read permission to viewer role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name = 'viewer' AND p.name = 'knowledge.read'
ON CONFLICT DO NOTHING;

-- Create function to update document count
CREATE OR REPLACE FUNCTION update_collection_document_count()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE knowledge_collections
    SET document_count = document_count + 1, updated_at = now()
    WHERE id = NEW.collection_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE knowledge_collections
    SET document_count = document_count - 1, updated_at = now()
    WHERE id = OLD.collection_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.collection_id IS DISTINCT FROM NEW.collection_id THEN
    IF OLD.collection_id IS NOT NULL THEN
      UPDATE knowledge_collections
      SET document_count = document_count - 1, updated_at = now()
      WHERE id = OLD.collection_id;
    END IF;
    IF NEW.collection_id IS NOT NULL THEN
      UPDATE knowledge_collections
      SET document_count = document_count + 1, updated_at = now()
      WHERE id = NEW.collection_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_collection_document_count ON knowledge_documents;
CREATE TRIGGER trigger_update_collection_document_count
  AFTER INSERT OR DELETE OR UPDATE ON knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION update_collection_document_count();

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_collections_user_id ON knowledge_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_user_id ON knowledge_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_collection_id ON knowledge_documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_weaviate_id ON knowledge_documents(weaviate_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_title ON knowledge_documents USING gin(to_tsvector('english', title));