import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables. SUPABASE_SERVICE_ROLE_KEY is required for admin operations.');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

interface WebhookMessage {
  key: {
    id: string;
    remoteJid: string;
    fromMe?: boolean;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: { text?: string };
    imageMessage?: { caption?: string };
    videoMessage?: Record<string, unknown>;
    audioMessage?: Record<string, unknown>;
    documentMessage?: Record<string, unknown>;
  };
}

interface MessagesUpsertData {
  messages?: WebhookMessage[];
}

interface MessageUpdateItem {
  key?: { id?: string };
  update?: { status?: number };
}

interface ConnectionUpdateData {
  state?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, instance, data } = body;

    const supabase = getSupabaseAdmin();

    const { data: instanceConfig } = await supabase
      .from('instance_configs')
      .select('id, user_id')
      .eq('instance_name', instance)
      .maybeSingle();

    await supabase.from('webhook_events').insert({
      user_id: instanceConfig?.user_id || null,
      instance_id: instanceConfig?.id || null,
      event_type: event,
      payload: body,
      processed: false,
    });

    switch (event) {
      case 'MESSAGES_UPSERT':
        await handleMessagesUpsert(supabase, instanceConfig, data, instance);
        break;

      case 'MESSAGES_UPDATE':
        await handleMessagesUpdate(supabase, instanceConfig, data);
        break;

      case 'CONNECTION_UPDATE':
        await handleConnectionUpdate(supabase, instanceConfig, data);
        break;

      case 'QRCODE_UPDATED':
        break;

      default:
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleMessagesUpsert(
  supabase: ReturnType<typeof createClient>,
  instanceConfig: { id: string; user_id: string } | null,
  data: MessagesUpsertData | null,
  instanceName: string
) {
  if (!instanceConfig || !data) return;

  for (const message of data.messages || []) {
    const remoteJid = message.key?.remoteJid;
    if (!remoteJid) continue;

    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('user_id', instanceConfig.user_id)
      .eq('instance_id', instanceConfig.id)
      .eq('remote_jid', remoteJid)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv } = await supabase
        .from('conversations')
        .insert({
          user_id: instanceConfig.user_id,
          instance_id: instanceConfig.id,
          remote_jid: remoteJid,
          is_group: remoteJid.includes('@g.us'),
        })
        .select()
        .single();
      conversation = newConv;
    }

    if (!conversation) continue;

    const messageContent =
      message.message?.conversation ||
      message.message?.extendedTextMessage?.text ||
      message.message?.imageMessage?.caption ||
      '';

    const messageType = message.message?.imageMessage
      ? 'image'
      : message.message?.videoMessage
        ? 'video'
        : message.message?.audioMessage
          ? 'audio'
          : message.message?.documentMessage
            ? 'document'
            : 'text';

    await supabase.from('messages').upsert(
      {
        user_id: instanceConfig.user_id,
        conversation_id: conversation.id,
        instance_id: instanceConfig.id,
        message_id: message.key.id,
        remote_jid: remoteJid,
        from_me: message.key.fromMe || false,
        message_type: messageType,
        content: messageContent,
        status: 'sent',
        raw_data: message,
      },
      {
        onConflict: 'user_id,message_id',
      }
    );

    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: messageContent?.substring(0, 100) || '',
      })
      .eq('id', conversation.id);

    if (!message.key.fromMe && messageContent) {
      await processIncomingMessageWithAI(
        supabase,
        instanceConfig,
        conversation.id,
        remoteJid,
        messageContent,
        instanceName
      );
    }
  }
}

async function processIncomingMessageWithAI(
  supabase: ReturnType<typeof createClient>,
  instanceConfig: { id: string; user_id: string },
  conversationId: string,
  remoteJid: string,
  messageContent: string,
  instanceName: string
) {
  try {
    const { data: activeAgents } = await supabase
      .from('ai_agents')
      .select(`
        *,
        knowledge_links:agent_knowledge_links(
          collection:knowledge_collections(*)
        )
      `)
      .eq('user_id', instanceConfig.user_id)
      .eq('is_active', true)
      .limit(1);

    if (!activeAgents || activeAgents.length === 0) {
      return;
    }

    const agent = activeAgents[0];

    const { data: profile } = await supabase
      .from('profiles')
      .select('evolution_api_url, evolution_api_key, pica_secret_key, pica_weaviate_connection_key')
      .eq('id', instanceConfig.user_id)
      .maybeSingle();

    if (!profile?.evolution_api_url || !profile?.evolution_api_key) {
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const aiResponse = await fetch(`${baseUrl}/api/ai/process-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: instanceConfig.user_id,
        agentId: agent.id,
        conversationId,
        instanceName,
        remoteJid,
        message: messageContent,
        evolutionApiUrl: profile.evolution_api_url,
        evolutionApiKey: profile.evolution_api_key,
        picaSecretKey: profile.pica_secret_key,
        picaWeaviateConnectionKey: profile.pica_weaviate_connection_key,
      }),
    });

    if (!aiResponse.ok) {
      console.error('AI processing failed:', await aiResponse.text());
    }
  } catch (error) {
    console.error('Error processing message with AI:', error);
  }
}

async function handleMessagesUpdate(
  supabase: ReturnType<typeof createClient>,
  instanceConfig: { id: string; user_id: string } | null,
  data: MessageUpdateItem[] | null
) {
  if (!instanceConfig || !data) return;

  for (const update of data) {
    const messageId = update.key?.id;
    const status = update.update?.status;

    if (!messageId || !status) continue;

    const statusMap: Record<number, string> = {
      1: 'pending',
      2: 'sent',
      3: 'delivered',
      4: 'read',
      5: 'read',
    };

    await supabase
      .from('messages')
      .update({ status: statusMap[status] || 'sent' })
      .eq('user_id', instanceConfig.user_id)
      .eq('message_id', messageId);
  }
}

async function handleConnectionUpdate(
  supabase: ReturnType<typeof createClient>,
  instanceConfig: { id: string; user_id: string } | null,
  data: ConnectionUpdateData | null
) {
  if (!instanceConfig) return;

  const state = data?.state;
  const statusMap: Record<string, string> = {
    open: 'open',
    connecting: 'connecting',
    close: 'closed',
  };

  if (state && statusMap[state]) {
    await supabase
      .from('instance_configs')
      .update({
        status: statusMap[state],
        last_activity_at: new Date().toISOString(),
      })
      .eq('id', instanceConfig.id);
  }
}
