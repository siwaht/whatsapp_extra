'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit,
  FolderOpen,
  Tag,
  Database,
  Sparkles,
  Grid,
  List,
  RefreshCw,
  Globe,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Eye,
  Layers,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { UploadDialog, type UploadConfig } from '@/components/knowledge/upload-dialog';
import { chunkText, CHUNKING_PRESETS } from '@/lib/chunking';
import {
  createWeaviateObject,
  deleteWeaviateObject,
  type PicaCredentials,
} from '@/lib/pica-api';
import type { KnowledgeDocument, KnowledgeCollection } from '@/types/database';

interface DocumentWithCollection extends KnowledgeDocument {
  collection?: KnowledgeCollection | null;
  chunk_count?: number;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
  },
  processing: {
    icon: Loader2,
    label: 'Processing',
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
    animate: true,
  },
  completed: {
    icon: CheckCircle2,
    label: 'Completed',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30',
  },
  failed: {
    icon: AlertCircle,
    label: 'Failed',
    color: 'text-red-600 bg-red-50 dark:bg-red-950/30',
  },
};

function DocumentCard({
  document,
  onEdit,
  onDelete,
  onViewChunks,
  onReprocess,
}: {
  document: DocumentWithCollection;
  onEdit: (doc: DocumentWithCollection) => void;
  onDelete: (id: string) => void;
  onViewChunks: (doc: DocumentWithCollection) => void;
  onReprocess: (id: string) => void;
}) {
  const metadata = document.metadata as { tags?: string[] } | null;
  const status = statusConfig[document.processing_status || 'pending'];
  const StatusIcon = status.icon;

  return (
    <Card className="group transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                document.has_vector
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              )}
            >
              {document.source_type === 'url' ? (
                <Globe className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-medium truncate">{document.title}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn('text-xs', status.color)}>
                  <StatusIcon
                    className={cn(
                      'h-3 w-3 mr-1',
                      status.animate && 'animate-spin'
                    )}
                  />
                  {status.label}
                </Badge>
                {document.source_type === 'url' && (
                  <Badge variant="secondary" className="text-xs">
                    URL
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewChunks(document)}>
                <Layers className="mr-2 h-4 w-4" />
                View Chunks
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(document)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {document.processing_status === 'failed' && (
                <DropdownMenuItem onClick={() => onReprocess(document.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reprocess
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(document.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {document.content_preview && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {document.content_preview}
          </p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {document.has_vector && (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Vectorized
            </Badge>
          )}
          {document.chunk_count > 0 && (
            <Badge variant="outline">
              <Layers className="mr-1 h-3 w-3" />
              {document.chunk_count} chunks
            </Badge>
          )}
          {document.collection && (
            <Badge variant="outline">
              <FolderOpen className="mr-1 h-3 w-3" />
              {document.collection.name}
            </Badge>
          )}
          {metadata?.tags?.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              <Tag className="mr-1 h-2.5 w-2.5" />
              {tag}
            </Badge>
          ))}
        </div>

        {document.source_url && (
          <p className="mt-2 text-xs text-muted-foreground truncate">
            {document.source_url}
          </p>
        )}

        <div className="mt-3 text-xs text-muted-foreground">
          {new Date(document.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );
}

function CollectionCard({
  collection,
  onSelect,
  onDelete,
}: {
  collection: KnowledgeCollection;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5"
      onClick={() => onSelect(collection.id)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderOpen className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium">{collection.name}</h3>
              <p className="text-xs text-muted-foreground">
                {collection.document_count} documents
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(collection.id);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {collection.description && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {collection.description}
          </p>
        )}
        <Badge variant="outline" className="mt-3">
          {collection.weaviate_class}
        </Badge>
      </CardContent>
    </Card>
  );
}

export default function KnowledgePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabase();
  const [activeTab, setActiveTab] = useState('documents');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [showChunksDialog, setShowChunksDialog] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<DocumentWithCollection | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isUploading, setIsUploading] = useState(false);
  const [newCollection, setNewCollection] = useState({
    name: '',
    description: '',
    weaviate_class: 'Document',
  });

  const picaCredentials: PicaCredentials | null = user?.profile?.pica_secret_key
    ? {
        secretKey: user.profile.pica_secret_key,
        weaviateConnectionKey: user.profile.pica_weaviate_connection_key || '',
      }
    : null;

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['knowledge-documents', user?.id, selectedCollection],
    queryFn: async () => {
      let query = supabase
        .from('knowledge_documents')
        .select('*, collection:knowledge_collections(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (selectedCollection) {
        query = query.eq('collection_id', selectedCollection);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentWithCollection[];
    },
    enabled: !!user?.id,
  });

  const { data: collections, isLoading: collectionsLoading } = useQuery({
    queryKey: ['knowledge-collections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_collections')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as KnowledgeCollection[];
    },
    enabled: !!user?.id,
  });

  const { data: chunks } = useQuery({
    queryKey: ['knowledge-chunks', selectedDocument?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_chunks')
        .select('*')
        .eq('document_id', selectedDocument!.id)
        .order('chunk_index');

      if (error) throw error;
      return data;
    },
    enabled: !!selectedDocument?.id && showChunksDialog,
  });

  const handleUpload = async (config: UploadConfig) => {
    if (!user?.id) return;

    setIsUploading(true);
    try {
      const { data: doc, error: docError } = await supabase
        .from('knowledge_documents')
        .insert({
          user_id: user.id,
          title: config.title,
          content: config.content,
          content_preview: config.content.substring(0, 500),
          source_type: config.sourceType,
          source_url: config.sourceUrl || null,
          file_type: config.fileType || null,
          collection_id: config.collectionId || null,
          weaviate_class: config.weaviateClass,
          processing_status: 'processing',
          has_vector: false,
        })
        .select()
        .single();

      if (docError) throw docError;

      const preset = CHUNKING_PRESETS[config.chunkingPreset];
      const chunkOptions = {
        chunkSize: config.customChunkSize || preset.chunkSize,
        chunkOverlap: config.customChunkOverlap || preset.chunkOverlap,
      };

      const textChunks = chunkText(config.content, chunkOptions);

      const chunkRecords = textChunks.map((chunk) => ({
        document_id: doc.id,
        user_id: user.id,
        chunk_index: chunk.index,
        content: chunk.content,
        token_count: chunk.tokenCount,
        metadata: chunk.metadata,
      }));

      if (chunkRecords.length > 0) {
        const { error: chunksError } = await supabase
          .from('knowledge_chunks')
          .insert(chunkRecords);

        if (chunksError) throw chunksError;
      }

      let hasVector = false;
      if (picaCredentials && picaCredentials.weaviateConnectionKey) {
        try {
          for (const chunk of textChunks) {
            const result = await createWeaviateObject(picaCredentials, {
              class: config.weaviateClass,
              properties: {
                content: chunk.content,
                title: config.title,
                documentId: doc.id,
                chunkIndex: chunk.index,
              },
            });

            await supabase
              .from('knowledge_chunks')
              .update({ weaviate_id: result.id })
              .eq('document_id', doc.id)
              .eq('chunk_index', chunk.index);
          }
          hasVector = true;
        } catch (vectorError) {
          console.error('Vector upload failed:', vectorError);
          toast.error('Vector upload failed', {
            description: 'Document saved but vector embeddings failed',
          });
        }
      }

      await supabase
        .from('knowledge_documents')
        .update({
          processing_status: 'completed',
          chunk_count: textChunks.length,
          has_vector: hasVector,
        })
        .eq('id', doc.id);

      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-collections'] });
      setShowUploadDialog(false);
      toast.success('Document uploaded successfully', {
        description: `Created ${textChunks.length} chunks`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const createCollectionMutation = useMutation({
    mutationFn: async (collection: typeof newCollection) => {
      const { data, error } = await supabase
        .from('knowledge_collections')
        .insert({
          user_id: user!.id,
          name: collection.name,
          description: collection.description,
          weaviate_class: collection.weaviate_class,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-collections'] });
      setShowCollectionDialog(false);
      setNewCollection({ name: '', description: '', weaviate_class: 'Document' });
      toast.success('Collection created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create collection', { description: error.message });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: chunks } = await supabase
        .from('knowledge_chunks')
        .select('weaviate_id, id')
        .eq('document_id', id);

      if (picaCredentials && chunks) {
        const doc = documents?.find((d) => d.id === id);
        for (const chunk of chunks) {
          if (chunk.weaviate_id) {
            try {
              await deleteWeaviateObject(
                picaCredentials,
                doc?.weaviate_class || 'Document',
                chunk.weaviate_id
              );
            } catch (e) {
              console.error('Failed to delete vector:', e);
            }
          }
        }
      }

      const { error } = await supabase
        .from('knowledge_documents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-collections'] });
      toast.success('Document deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete document', { description: error.message });
    },
  });

  const deleteCollectionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('knowledge_collections')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledge-collections'] });
      if (selectedCollection) setSelectedCollection(null);
      toast.success('Collection deleted successfully');
    },
  });

  const filteredDocuments = documents?.filter((doc) => {
    if (!searchQuery) return true;
    return (
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content_preview?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const stats = {
    totalDocuments: documents?.length || 0,
    vectorized: documents?.filter((d) => d.has_vector).length || 0,
    collections: collections?.length || 0,
    totalChunks: documents?.reduce((acc, d) => acc + (d.chunk_count || 0), 0) || 0,
  };

  return (
    <div className="flex flex-col">
      <Header title="Knowledge Base" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Knowledge Base</h2>
            <p className="text-muted-foreground">
              Store and search documents with vector embeddings for RAG
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCollectionDialog(true)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              New Collection
            </Button>
            <Button
              onClick={() => setShowUploadDialog(true)}
              className="gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Document
            </Button>
          </div>
        </div>

        {!picaCredentials && (
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Pica credentials not configured
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Configure your Pica API keys in Settings to enable vector search
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-2 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalDocuments}</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.vectorized}</p>
                  <p className="text-sm text-muted-foreground">Vectorized</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalChunks}</p>
                  <p className="text-sm text-muted-foreground">Chunks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-violet-500/10 p-2 text-violet-500">
                  <FolderOpen className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.collections}</p>
                  <p className="text-sm text-muted-foreground">Collections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <TabsList>
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex rounded-lg border p-1">
                <Button
                  variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <TabsContent value="documents" className="mt-6">
            {selectedCollection && (
              <div className="mb-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  <FolderOpen className="mr-1 h-3 w-3" />
                  {collections?.find((c) => c.id === selectedCollection)?.name}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCollection(null)}
                >
                  Clear filter
                </Button>
              </div>
            )}

            {documentsLoading ? (
              <div
                className={cn(
                  'grid gap-4',
                  viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                )}
              >
                {[...Array(6)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div>
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="mt-2 h-3 w-20" />
                        </div>
                      </div>
                      <Skeleton className="mt-3 h-12 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredDocuments && filteredDocuments.length > 0 ? (
              <div
                className={cn(
                  'grid gap-4',
                  viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'
                )}
              >
                {filteredDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onEdit={(d) => setSelectedDocument(d)}
                    onDelete={(id) => deleteDocumentMutation.mutate(id)}
                    onViewChunks={(d) => {
                      setSelectedDocument(d);
                      setShowChunksDialog(true);
                    }}
                    onReprocess={(id) => {
                      toast.info('Reprocessing document...');
                    }}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Database className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No documents yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    Add documents to your knowledge base to enable semantic search
                    and power your AI agents with context.
                  </p>
                  <Button
                    onClick={() => setShowUploadDialog(true)}
                    className="mt-6 gradient-primary text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Document
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="collections" className="mt-6">
            {collectionsLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <Skeleton className="mt-3 h-5 w-32" />
                      <Skeleton className="mt-2 h-4 w-24" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : collections && collections.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    collection={collection}
                    onSelect={(id) => {
                      setSelectedCollection(id);
                      setActiveTab('documents');
                    }}
                    onDelete={(id) => deleteCollectionMutation.mutate(id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <FolderOpen className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No collections yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    Create collections to organize your documents by topic or purpose.
                  </p>
                  <Button
                    onClick={() => setShowCollectionDialog(true)}
                    className="mt-6"
                    variant="outline"
                  >
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Create Collection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <UploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        collections={collections || []}
        onUpload={handleUpload}
        isUploading={isUploading}
      />

      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Create a new collection to organize your documents
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="col-name">Name</Label>
              <Input
                id="col-name"
                placeholder="Collection name"
                value={newCollection.name}
                onChange={(e) =>
                  setNewCollection((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-desc">Description</Label>
              <Textarea
                id="col-desc"
                placeholder="What is this collection for?"
                value={newCollection.description}
                onChange={(e) =>
                  setNewCollection((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-class">Weaviate Class</Label>
              <Select
                value={newCollection.weaviate_class}
                onValueChange={(value) =>
                  setNewCollection((prev) => ({ ...prev, weaviate_class: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Document">Document</SelectItem>
                  <SelectItem value="File">File</SelectItem>
                  <SelectItem value="Article">Article</SelectItem>
                  <SelectItem value="FAQ">FAQ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectionDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createCollectionMutation.mutate(newCollection)}
              disabled={!newCollection.name || createCollectionMutation.isPending}
              className="gradient-primary text-white"
            >
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showChunksDialog} onOpenChange={setShowChunksDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Document Chunks</DialogTitle>
            <DialogDescription>
              {selectedDocument?.title} - {chunks?.length || 0} chunks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto py-4">
            {chunks?.map((chunk) => (
              <Card key={chunk.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">Chunk {chunk.chunk_index + 1}</Badge>
                    <span className="text-xs text-muted-foreground">
                      ~{chunk.token_count} tokens
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-4">
                    {chunk.content}
                  </p>
                  {chunk.weaviate_id && (
                    <p className="mt-2 text-xs text-emerald-600">
                      Vectorized: {chunk.weaviate_id.substring(0, 8)}...
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowChunksDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
