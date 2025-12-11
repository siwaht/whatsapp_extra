import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getEvolutionAPI } from '@/lib/evolution-api';

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
    const { instanceName } = body;

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Instance name is required' },
        { status: 400 }
      );
    }

    const evolutionApi = getEvolutionAPI();
    const qrcode = await evolutionApi.connectInstance(instanceName);

    return NextResponse.json({ qrcode });
  } catch (error: any) {
    console.error('Error connecting instance:', error);
    const errorMessage = error?.message || 'Failed to connect instance';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
