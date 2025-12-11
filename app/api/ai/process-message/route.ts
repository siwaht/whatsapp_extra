import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { searchWeaviate, hybridSearchWeaviate, type PicaCredentials } from '@/lib/pica-api';
import { builtInTools, formatToolsForPrompt } from '@/lib/ai-agent-tools';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      agentId,
      conversationId,
      instanceName,
      remoteJid,
      message,
      evolutionApiUrl,
      evolutionApiKey,
      picaSecretKey,
      picaWeaviateConnectionKey,
    } = body;

    if (!userId || !agentId || !message) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: agent } = await supabase
      .from('ai_agents')
      .select(`
        *,
        knowledge_links:agent_knowledge_links(
          collection:knowledge_collections(*)
        )
      `)
      .eq('id', agentId)
      .maybeSingle();

    if (!agent) {
      return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
    }

    let contextChunks: string[] = [];

    if (picaSecretKey && picaWeaviateConnectionKey) {
      const picaCredentials: PicaCredentials = {
        secretKey: picaSecretKey,
        weaviateConnectionKey: picaWeaviateConnectionKey,
      };

      try {
        const collections = (agent.knowledge_links as any[]) || [];

        for (const link of collections) {
          const collection = link.collection;
          if (!collection) continue;

          const results = await hybridSearchWeaviate(
            picaCredentials,
            collection.weaviate_class || 'Document',
            message,
            5,
            0.7
          );

          for (const result of results) {
            const content = result.properties.content as string;
            if (content) {
              contextChunks.push(content);
            }
          }
        }
      } catch (error) {
        console.error('Knowledge base search error:', error);
      }
    }

    const { data: recentMessages } = await supabase
      .from('messages')
      .select('content, from_me, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(10);

    const conversationHistory = (recentMessages || [])
      .reverse()
      .map((msg) => `${msg.from_me ? 'Assistant' : 'User'}: ${msg.content}`)
      .join('\n');

    const systemPrompt = agent.system_prompt || 'You are a helpful WhatsApp assistant.';
    const toolsInfo = formatToolsForPrompt(Object.values(builtInTools));

    const aiPrompt = `${systemPrompt}

${contextChunks.length > 0 ? `\n# Knowledge Base Context\n${contextChunks.join('\n\n---\n\n')}\n` : ''}

# Conversation History
${conversationHistory}

# Available Tools
${toolsInfo}

# Current Message
User: ${message}

Instructions:
- Provide a helpful, concise response to the user's message
- Use the knowledge base context if relevant to answer the question
- Consider the conversation history for context
- Keep responses appropriate for WhatsApp (concise, friendly)

Response:`;

    const aiResponse = await generateAIResponse(agent, aiPrompt);

    if (aiResponse && evolutionApiUrl && evolutionApiKey) {
      const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', ''),
          text: aiResponse,
        }),
      });

      if (!sendResponse.ok) {
        console.error('Failed to send AI response:', await sendResponse.text());
      }
    }

    return NextResponse.json({ success: true, response: aiResponse });
  } catch (error) {
    console.error('AI processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

async function generateAIResponse(agent: any, prompt: string): Promise<string> {
  const modelName = agent.model || 'gpt-4';

  const simpleResponse = `Based on your message, here's a helpful response. (Note: This is a placeholder. To use actual AI models like GPT-4 or Claude, you need to:
1. Add your OpenAI/Anthropic API key to the environment
2. Integrate the AI model SDK
3. Configure the agent settings properly)`;

  return simpleResponse;
}
