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

    const evolutionApi = getEvolutionAPI();

    const { data: localInstances } = await supabase
      .from('instance_configs')
      .select('*')
      .eq('user_id', user.id);

    if (!localInstances || localInstances.length === 0) {
      return NextResponse.json({ synced: 0 });
    }

    const evolutionInstances = await evolutionApi.getInstances();

    let syncedCount = 0;

    interface EvolutionInstance {
      instanceName: string;
      status?: string;
      owner?: string;
    }

    for (const localInstance of localInstances) {
      const evolutionInstance = evolutionInstances.find(
        (ei: EvolutionInstance) => ei.instanceName === localInstance.instance_name
      );

      if (evolutionInstance) {
        const updates: Record<string, string> = {
          updated_at: new Date().toISOString(),
        };

        if (evolutionInstance.status !== localInstance.status) {
          updates.status = evolutionInstance.status;
        }

        if (evolutionInstance.owner && evolutionInstance.owner !== localInstance.phone_number) {
          updates.phone_number = evolutionInstance.owner;
        }

        if (Object.keys(updates).length > 1) {
          await supabase
            .from('instance_configs')
            .update(updates)
            .eq('id', localInstance.id);
          syncedCount++;
        }
      }
    }

    return NextResponse.json({ synced: syncedCount });
  } catch (error) {
    console.error('Error syncing instances:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to sync instances';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
