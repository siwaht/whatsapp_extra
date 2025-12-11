import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getEvolutionAPI } from '@/lib/evolution-api';

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

    const evolutionApi = getEvolutionAPI();
    const instances = await evolutionApi.getInstances();

    return NextResponse.json({ instances });
  } catch (error) {
    console.error('Error fetching instances:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch instances';
    return NextResponse.json(
      { error: errorMessage },
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
    const { instanceName, webhookUrl } = body;

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      );
    }

    const evolutionApi = getEvolutionAPI();

    const result = await evolutionApi.createInstance(instanceName, {
      qrcode: true,
      webhookUrl,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating instance:', error);

    const errorMessage = error?.message || 'Failed to create instance';
    const statusCode = error?.status || 500;

    return NextResponse.json(
      { error: errorMessage, code: error?.code },
      { status: statusCode >= 400 && statusCode < 600 ? statusCode : 500 }
    );
  }
}