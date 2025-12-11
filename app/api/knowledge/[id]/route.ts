import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { WeaviateAPI } from '@/lib/weaviate-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: document, error } = await supabase
      .from('knowledge_documents')
      .select('*, collection:knowledge_collections(*)')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: existingDoc } = await supabase
      .from('knowledge_documents')
      .select('weaviate_id, weaviate_class')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (existingDoc.weaviate_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pica_secret_key, pica_weaviate_connection_key')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.pica_secret_key && profile?.pica_weaviate_connection_key) {
        const weaviateApi = new WeaviateAPI({
          secretKey: profile.pica_secret_key,
          connectionKey: profile.pica_weaviate_connection_key,
        });

        await weaviateApi.updateDocument(existingDoc.weaviate_id, {
          class: existingDoc.weaviate_class,
          properties: {
            title: body.title,
            content: body.content,
            metadata: body.metadata,
          },
        });
      }
    }

    const { data: document, error } = await supabase
      .from('knowledge_documents')
      .update({
        title: body.title,
        content_preview: body.content?.substring(0, 500),
        metadata: body.metadata,
        collection_id: body.collection_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: existingDoc } = await supabase
      .from('knowledge_documents')
      .select('weaviate_id, weaviate_class')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingDoc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (existingDoc.weaviate_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('pica_secret_key, pica_weaviate_connection_key')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.pica_secret_key && profile?.pica_weaviate_connection_key) {
        const weaviateApi = new WeaviateAPI({
          secretKey: profile.pica_secret_key,
          connectionKey: profile.pica_weaviate_connection_key,
        });

        try {
          await weaviateApi.deleteDocument(
            existingDoc.weaviate_id,
            existingDoc.weaviate_class
          );
        } catch (weaviateError) {
          console.error('Weaviate deletion error:', weaviateError);
        }
      }
    }

    const { error } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('id', params.id)
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}