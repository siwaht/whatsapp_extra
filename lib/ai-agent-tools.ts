import type { AITool } from '@/types/database';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, unknown>, context: ToolContext) => Promise<unknown>;
}

export interface ToolContext {
  userId: string;
  instanceId?: string;
  conversationId?: string;
  evolutionApiUrl?: string;
  evolutionApiKey?: string;
  picaSecretKey?: string;
  picaWeaviateConnectionKey?: string;
}

export const builtInTools: Record<string, ToolDefinition> = {
  search_knowledge_base: {
    name: 'search_knowledge_base',
    description: 'Search the knowledge base for relevant information using semantic search',
    parameters: [
      {
        name: 'query',
        type: 'string',
        description: 'The search query',
        required: true,
      },
      {
        name: 'collection_id',
        type: 'string',
        description: 'Optional collection ID to search within',
        required: false,
      },
      {
        name: 'limit',
        type: 'number',
        description: 'Maximum number of results to return',
        required: false,
        default: 5,
      },
    ],
    execute: async (params, context) => {
      const { query, collection_id, limit = 5 } = params as {
        query: string;
        collection_id?: string;
        limit?: number;
      };

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/knowledge/search`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query,
              limit,
              collectionId: collection_id,
              userId: context.userId,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Search failed');
        }

        const results = await response.json();
        return results;
      } catch (error) {
        console.error('Knowledge base search error:', error);
        return { error: 'Failed to search knowledge base' };
      }
    },
  },

  send_whatsapp_message: {
    name: 'send_whatsapp_message',
    description: 'Send a WhatsApp message to a contact',
    parameters: [
      {
        name: 'number',
        type: 'string',
        description: 'Phone number to send to (with country code)',
        required: true,
      },
      {
        name: 'text',
        type: 'string',
        description: 'Message text to send',
        required: true,
      },
      {
        name: 'instance',
        type: 'string',
        description: 'WhatsApp instance name',
        required: false,
      },
    ],
    execute: async (params, context) => {
      const { number, text, instance } = params as {
        number: string;
        text: string;
        instance?: string;
      };

      if (!context.evolutionApiUrl || !context.evolutionApiKey) {
        return { error: 'Evolution API not configured' };
      }

      try {
        const response = await fetch(`${context.evolutionApiUrl}/message/sendText/${instance}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': context.evolutionApiKey,
          },
          body: JSON.stringify({
            number,
            text,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        return await response.json();
      } catch (error) {
        console.error('Send message error:', error);
        return { error: 'Failed to send message' };
      }
    },
  },

  get_contact_info: {
    name: 'get_contact_info',
    description: 'Get information about a WhatsApp contact',
    parameters: [
      {
        name: 'number',
        type: 'string',
        description: 'Phone number to look up',
        required: true,
      },
    ],
    execute: async (params, context) => {
      const { number } = params as { number: string };

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: contact } = await supabase
          .from('contacts')
          .select('*')
          .eq('user_id', context.userId)
          .eq('phone_number', number)
          .maybeSingle();

        return contact || { message: 'Contact not found' };
      } catch (error) {
        console.error('Get contact error:', error);
        return { error: 'Failed to get contact info' };
      }
    },
  },

  get_conversation_history: {
    name: 'get_conversation_history',
    description: 'Get recent messages from a conversation',
    parameters: [
      {
        name: 'limit',
        type: 'number',
        description: 'Number of messages to retrieve',
        required: false,
        default: 10,
      },
    ],
    execute: async (params, context) => {
      const { limit = 10 } = params as { limit?: number };

      if (!context.conversationId) {
        return { error: 'No conversation context' };
      }

      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', context.conversationId)
          .order('created_at', { ascending: false })
          .limit(limit);

        return messages || [];
      } catch (error) {
        console.error('Get conversation history error:', error);
        return { error: 'Failed to get conversation history' };
      }
    },
  },

  get_current_time: {
    name: 'get_current_time',
    description: 'Get the current date and time',
    parameters: [],
    execute: async () => {
      return {
        timestamp: new Date().toISOString(),
        formatted: new Date().toLocaleString('en-US', {
          dateStyle: 'full',
          timeStyle: 'long',
        }),
      };
    },
  },
};

export function getToolDefinition(toolName: string): ToolDefinition | null {
  return builtInTools[toolName] || null;
}

export function getAllToolDefinitions(): ToolDefinition[] {
  return Object.values(builtInTools);
}

export async function executeToolFromDB(
  tool: AITool,
  params: Record<string, unknown>,
  context: ToolContext
): Promise<unknown> {
  if (tool.tool_type === 'built_in' && tool.name in builtInTools) {
    return builtInTools[tool.name].execute(params, context);
  }

  if (tool.tool_type === 'http_endpoint' && tool.endpoint_url) {
    try {
      const response = await fetch(tool.endpoint_url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tool.auth_config as Record<string, string>),
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tool execution error:', error);
      return { error: `Failed to execute tool: ${error}` };
    }
  }

  return { error: 'Unsupported tool type' };
}

export function formatToolsForPrompt(tools: ToolDefinition[]): string {
  return tools
    .map((tool) => {
      const params = tool.parameters
        .map((p) => `  - ${p.name} (${p.type}${p.required ? ', required' : ', optional'}): ${p.description}`)
        .join('\n');
      return `**${tool.name}**\nDescription: ${tool.description}\nParameters:\n${params}`;
    })
    .join('\n\n');
}
