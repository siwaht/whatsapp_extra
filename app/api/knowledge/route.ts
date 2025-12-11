import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { WeaviateAPI } from '@/lib/weaviate-api';

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
    const collectionId = searchParams.get('collection');
    const type = searchParams.get('type') || 'documents';

    if (type === 'collections') {
      const { data: collections, error } = await supabase
        .from('knowledge_collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json({ collections });
    }

    let query = supabase
      .from('knowledge_documents')
      .select('*, collection:knowledge_collections(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (collectionId) {
      query = query.eq('collection_id', collectionId);
    }

    const { data: documents, error } = await query;

    if (error) throw error;
    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to fetch knowledge' },
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
    const { type, ...data } = body;

    if (type === 'collection') {
      const { data: collection, error } = await supabase
        .from('knowledge_collections')
        .insert({
          user_id: user.id,
          name: data.name,
          description: data.description,
          weaviate_class: data.weaviate_class || 'Document',
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ collection });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('pica_secret_key, pica_weaviate_connection_key')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.pica_secret_key || !profile?.pica_weaviate_connection_key) {
      const { data: document, error } = await supabase
        .from('knowledge_documents')
        .insert({
          user_id: user.id,
          collection_id: data.collection_id,
          title: data.title,
          content_preview: data.content?.substring(0, 500),
          metadata: data.metadata || {},
          weaviate_class: data.class || 'Document',
          has_vector: false,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({
        document,
        message: 'Document saved locally. Configure Pica credentials to sync with Weaviate.',
      });
    }

    const weaviateApi = new WeaviateAPI({
      secretKey: profile.pica_secret_key,
      connectionKey: profile.pica_weaviate_connection_key,
    });

    const weaviateDoc = await weaviateApi.createDocument({
      class: data.class || 'Document',
      properties: {
        title: data.title,
        content: data.content,
        metadata: data.metadata || {},
      },
      vector: data.vector,
    });

    const { data: document, error } = await supabase
      .from('knowledge_documents')
      .insert({
        user_id: user.id,
        collection_id: data.collection_id,
        weaviate_id: weaviateDoc.id,
        weaviate_class: weaviateDoc.class,
        title: data.title,
        content_preview: data.content?.substring(0, 500),
        metadata: data.metadata || {},
        has_vector: !!data.vector,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ document, weaviate: weaviateDoc });
  } catch (error) {
    console.error('Error creating knowledge:', error);
    return NextResponse.json(
      { error: 'Failed to create knowledge' },
      { status: 500 }
    );
  }
}