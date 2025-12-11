import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();

    const { data: status, error } = await supabase
      .from('evolution_api_status')
      .select('*')
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch version status', details: error.message },
        { status: 500 }
      );
    }

    if (!status) {
      const defaultStatus = {
        current_version: 'v2.1.1',
        latest_version: 'v2.1.1',
        update_available: false,
        auto_update_enabled: false,
        last_check_at: null,
      };
      return NextResponse.json(defaultStatus);
    }

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error fetching Evolution API version:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'check') {
      const latestVersion = await checkLatestVersion();

      const { data: currentStatus, error: fetchError } = await supabase
        .from('evolution_api_status')
        .select('current_version')
        .maybeSingle();

      if (fetchError) {
        return NextResponse.json(
          { error: 'Failed to fetch current version', details: fetchError.message },
          { status: 500 }
        );
      }

      const currentVersion = currentStatus?.current_version || 'v2.1.1';
      const updateAvailable = latestVersion !== currentVersion;

      const { error: updateError } = await supabase
        .from('evolution_api_status')
        .update({
          latest_version: latestVersion,
          last_check_at: new Date().toISOString(),
          update_available: updateAvailable,
        })
        .eq('id', currentStatus?.id || '');

      if (updateError && currentStatus) {
        return NextResponse.json(
          { error: 'Failed to update version status', details: updateError.message },
          { status: 500 }
        );
      }

      const { data: updated } = await supabase
        .from('evolution_api_status')
        .select('*')
        .maybeSingle();

      return NextResponse.json({
        success: true,
        current_version: currentVersion,
        latest_version: latestVersion,
        update_available: updateAvailable,
        data: updated,
      });
    }

    if (action === 'update') {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role_id, roles(name)')
        .eq('id', user.id)
        .single();

      if (!profile || (profile as any).roles?.name !== 'admin') {
        return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
      }

      const { data: status } = await supabase
        .from('evolution_api_status')
        .select('*')
        .maybeSingle();

      if (!status?.latest_version) {
        return NextResponse.json(
          { error: 'Latest version not available. Please check for updates first.' },
          { status: 400 }
        );
      }

      const { error: historyError } = await supabase
        .from('evolution_api_update_history')
        .insert({
          from_version: status.current_version,
          to_version: status.latest_version,
          status: 'pending',
          initiated_by: user.id,
        });

      if (historyError) {
        return NextResponse.json(
          { error: 'Failed to create update history', details: historyError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Update initiated. Please run: docker-compose pull evolution-api && docker-compose up -d evolution-api',
        from_version: status.current_version,
        to_version: status.latest_version,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error in version management:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkLatestVersion(): Promise<string> {
  try {
    const response = await fetch(
      'https://hub.docker.com/v2/repositories/atendai/evolution-api/tags?page_size=100'
    );

    if (!response.ok) {
      throw new Error('Failed to fetch from Docker Hub');
    }

    const data = await response.json();

    const versionTags = data.results
      .filter((tag: any) => /^v\d+\.\d+\.\d+$/.test(tag.name))
      .map((tag: any) => tag.name)
      .sort((a: string, b: string) => {
        const aVer = a.slice(1).split('.').map(Number);
        const bVer = b.slice(1).split('.').map(Number);

        for (let i = 0; i < 3; i++) {
          if (aVer[i] !== bVer[i]) {
            return bVer[i] - aVer[i];
          }
        }
        return 0;
      });

    return versionTags[0] || 'v2.1.1';
  } catch (error) {
    console.error('Error checking latest version:', error);
    return 'v2.1.1';
  }
}
