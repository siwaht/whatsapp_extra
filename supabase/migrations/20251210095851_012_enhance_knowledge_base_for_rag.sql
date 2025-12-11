/*
  # Enhanced Knowledge Base for RAG

  1. Modified Tables
    - `knowledge_documents`
      - Add `content` (text) - Full document content
      - Add `source_type` (text) - 'text', 'url', 'file'
      - Add `source_url` (text) - Original URL for scraped content
      - Add `file_type` (text) - File extension/mime type
      - Add `chunk_count` (integer) - Number of chunks created
      - Add `processing_status` (text) - 'pending', 'processing', 'completed', 'failed'
      - Add `error_message` (text) - Error details if processing failed

  2. New Tables
    - `knowledge_chunks` - Store document chunks for vector search
      - `id` (uuid, primary key)
      - `document_id` (uuid, references knowledge_documents)
      - `user_id` (uuid, references profiles)
      - `chunk_index` (integer) - Order of chunk in document
      - `content` (text) - Chunk text content
      - `weaviate_id` (text) - Weaviate vector ID
      - `token_count` (integer) - Approximate token count
      - `metadata` (jsonb) - Additional chunk metadata
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on knowledge_chunks
    - Users can only access their own chunks
*/

-- Add new columns to knowledge_documents
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'content'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN content text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN source_type text DEFAULT 'text';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'source_url'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN source_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'file_type'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN file_type text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'chunk_count'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN chunk_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'processing_status'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN processing_status text DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'knowledge_documents' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE knowledge_documents ADD COLUMN error_message text;
  END IF;
END $$;

-- Create knowledge_chunks table
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL DEFAULT 0,
  content text NOT NULL,
  weaviate_id text,
  token_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own chunks"
  ON knowledge_chunks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create indexes for knowledge_chunks
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_document_id ON knowledge_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_user_id ON knowledge_chunks(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_weaviate_id ON knowledge_chunks(weaviate_id);

-- Create index for processing status
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_status ON knowledge_documents(processing_status);
CREATE INDEX IF NOT EXISTS idx_knowledge_documents_source_type ON knowledge_documents(source_type);