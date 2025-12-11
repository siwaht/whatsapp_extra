import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { WeaviateAPI } from '@/lib/weaviate-api';

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
    const { query, className = 'Document', limit = 10, collectionId } = body;

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('pica_secret_key, pica_weaviate_connection_key')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.pica_secret_key || !profile?.pica_weaviate_connection_key) {
      let localQuery = supabase
        .from('knowledge_documents')
        .select('*, collection:knowledge_collections(*)')
        .eq('user_id', user.id)
        .textSearch('title', query, { type: 'websearch' })
        .limit(limit);

      if (collectionId) {
        localQuery = localQuery.eq('collection_id', collectionId);
      }

      const { data: documents, error } = await localQuery;

      if (error) throw error;

      return NextResponse.json({
        results: documents || [],
        source: 'local',
        message: 'Configure Pica credentials for semantic search',
      });
    }

    const weaviateApi = new WeaviateAPI({
      secretKey: profile.pica_secret_key,
      connectionKey: profile.pica_weaviate_connection_key,
    });

    const searchResults = await weaviateApi.searchDocuments(className, {
      nearText: {
        concepts: [query],
        certainty: 0.7,
      },
      limit,
    });

    const weaviateIds = searchResults.objects.map((obj) => obj.id);

    if (weaviateIds.length === 0) {
      return NextResponse.json({ results: [], source: 'weaviate' });
    }

    let enrichQuery = supabase
      .from('knowledge_documents')
      .select('*, collection:knowledge_collections(*)')
      .eq('user_id', user.id)
      .in('weaviate_id', weaviateIds);

    if (collectionId) {
      enrichQuery = enrichQuery.eq('collection_id', collectionId);
    }

    const { data: documents } = await enrichQuery;

    const enrichedResults = searchResults.objects.map((weaviateObj) => {
      const localDoc = documents?.find((d) => d.weaviate_id === weaviateObj.id);
      return {
        ...weaviateObj,
        localDocument: localDoc,
      };
    });

    return NextResponse.json({ results: enrichedResults, source: 'weaviate' });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to search knowledge' },
      { status: 500 }
    );
  }
}