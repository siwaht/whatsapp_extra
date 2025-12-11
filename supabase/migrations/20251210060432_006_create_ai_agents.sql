/*
  # WhatsAppX Schema - Part 6: AI Agents and Tools
  
  1. New Tables
    - `ai_tools` - MCP tools that agents can use
    - `ai_agents` - AI agent configurations
    - `ai_agent_tools` - Join table for agents and tools
  
  2. Security
    - Enable RLS on all tables
    - Users access only their own agents
*/

-- Create ai_tools table
CREATE TABLE IF NOT EXISTS ai_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  tool_type text DEFAULT 'mcp',
  endpoint_url text,
  auth_config jsonb DEFAULT '{}'::jsonb,
  parameters_schema jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tools"
  ON ai_tools FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create ai_agents table
CREATE TABLE IF NOT EXISTS ai_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  system_prompt text,
  model text DEFAULT 'gpt-4',
  temperature numeric(3,2) DEFAULT 0.7,
  max_tokens integer DEFAULT 2048,
  top_p numeric(3,2) DEFAULT 1.0,
  frequency_penalty numeric(3,2) DEFAULT 0.0,
  presence_penalty numeric(3,2) DEFAULT 0.0,
  parent_agent_id uuid REFERENCES ai_agents(id) ON DELETE SET NULL,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agents"
  ON ai_agents FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Create ai_agent_tools join table
CREATE TABLE IF NOT EXISTS ai_agent_tools (
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES ai_tools(id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, tool_id)
);

ALTER TABLE ai_agent_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agent tools"
  ON ai_agent_tools FOR ALL
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

-- Create ai_agent_instances join table (which agents are assigned to which instances)
CREATE TABLE IF NOT EXISTS ai_agent_instances (
  agent_id uuid NOT NULL REFERENCES ai_agents(id) ON DELETE CASCADE,
  instance_id uuid NOT NULL REFERENCES instance_configs(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  trigger_keywords jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (agent_id, instance_id)
);

ALTER TABLE ai_agent_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own agent instances"
  ON ai_agent_instances FOR ALL
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ai_tools_user_id ON ai_tools(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_user_id ON ai_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_agents_parent_id ON ai_agents(parent_agent_id);