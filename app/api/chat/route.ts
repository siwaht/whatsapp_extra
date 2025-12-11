import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { EvolutionAPI } from '@/lib/evolution-api';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const instanceName = searchParams.get('instance');
    const remoteJid = searchParams.get('remoteJid');

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.evolution_api_url || !profile?.evolution_api_key) {
      return NextResponse.json(
        { error: 'Evolution API not configured' },
        { status: 400 }
      );
    }

    const evolutionApi = new EvolutionAPI({
      baseUrl: profile.evolution_api_url,
      apiKey: profile.evolution_api_key,
    });

    if (remoteJid) {
      const messages = await evolutionApi.getMessages(instanceName, remoteJid);
      return NextResponse.json({ messages });
    } else {
      const chats = await evolutionApi.getChats(instanceName);
      return NextResponse.json({ chats });
    }
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { instanceName, number, text, mediaType, media, caption } = body;

    if (!instanceName || !number) {
      return NextResponse.json(
        { error: 'Instance name and number are required' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('evolution_api_url, evolution_api_key')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.evolution_api_url || !profile?.evolution_api_key) {
      return NextResponse.json(
        { error: 'Evolution API not configured' },
        { status: 400 }
      );
    }

    const evolutionApi = new EvolutionAPI({
      baseUrl: profile.evolution_api_url,
      apiKey: profile.evolution_api_key,
    });

    let result;
    if (mediaType && media) {
      result = await evolutionApi.sendMedia(instanceName, {
        number,
        mediatype: mediaType,
        media,
        caption,
      });
    } else if (text) {
      result = await evolutionApi.sendText(instanceName, {
        number,
        text,
      });
    } else {
      return NextResponse.json(
        { error: 'Message text or media is required' },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}