'use client';

import { useState } from 'react';
import {
  FileText,
  Globe,
  Plus,
  X,
  Settings2,
  Loader2,
  FileSpreadsheet,
  FileType,
  Upload,
  Link2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { CHUNKING_PRESETS, type ChunkingPreset } from '@/lib/chunking';
import type { KnowledgeCollection } from '@/types/database';

export interface UploadConfig {
  title: string;
  content: string;
  sourceType: 'text' | 'url' | 'file';
  sourceUrl?: string;
  fileType?: string;
  collectionId?: string;
  weaviateClass: string;
  chunkingPreset: ChunkingPreset;
  customChunkSize?: number;
  customChunkOverlap?: number;
  scrapeOptions?: {
    mode: 'single' | 'crawl';
    changeTracking: boolean;
    autoReplace: boolean;
  };
}

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collections: KnowledgeCollection[];
  onUpload: (config: UploadConfig) => Promise<void>;
  isUploading: boolean;
}

export function UploadDialog({
  open,
  onOpenChange,
  collections,
  onUpload,
  isUploading,
}: UploadDialogProps) {
  const [activeTab, setActiveTab] = useState<'text' | 'scrape'>('text');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [urls, setUrls] = useState<string[]>([]);
  const [currentUrl, setCurrentUrl] = useState('');
  const [config, setConfig] = useState<UploadConfig>({
    title: '',
    content: '',
    sourceType: 'text',
    weaviateClass: 'Document',
    chunkingPreset: 'medium',
    scrapeOptions: {
      mode: 'single',
      changeTracking: true,
      autoReplace: true,
    },
  });

  const handleAddUrl = () => {
    if (currentUrl && !urls.includes(currentUrl)) {
      setUrls([...urls, currentUrl]);
      setCurrentUrl('');
    }
  };

  const handleRemoveUrl = (url: string) => {
    setUrls(urls.filter((u) => u !== url));
  };

  const handleSubmit = async () => {
    if (activeTab === 'text') {
      await onUpload({
        ...config,
        sourceType: 'text',
      });
    } else {
      for (const url of urls) {
        await onUpload({
          ...config,
          title: config.title || new URL(url).hostname,
          sourceType: 'url',
          sourceUrl: url,
        });
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setConfig({
      title: '',
      content: '',
      sourceType: 'text',
      weaviateClass: 'Document',
      chunkingPreset: 'medium',
      scrapeOptions: {
        mode: 'single',
        changeTracking: true,
        autoReplace: true,
      },
    });
    setUrls([]);
    setCurrentUrl('');
    setShowAdvanced(false);
  };

  const isValid =
    activeTab === 'text'
      ? config.title && config.content
      : urls.length > 0;

  const selectedPreset = CHUNKING_PRESETS[config.chunkingPreset];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add to Knowledge Base</DialogTitle>
          <DialogDescription>
            Upload documents for RAG-powered AI responses
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'text' | 'scrape')}
          className="flex-1 overflow-hidden flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="text" className="gap-2">
              <FileText className="h-4 w-4" />
              Text Input
            </TabsTrigger>
            <TabsTrigger value="scrape" className="gap-2">
              <Globe className="h-4 w-4" />
              Scrape & Crawl
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="text" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Document Title</Label>
                <Input
                  id="title"
                  placeholder="Enter document title"
                  value={config.title}
                  onChange={(e) =>
                    setConfig({ ...config, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  placeholder="Paste your text content here..."
                  rows={8}
                  value={config.content}
                  onChange={(e) =>
                    setConfig({ ...config, content: e.target.value })
                  }
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  {config.content.length.toLocaleString()} characters
                </p>
              </div>
            </TabsContent>

            <TabsContent value="scrape" className="mt-0 space-y-4">
              <div className="space-y-2">
                <Label>Add URL to Scrape</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://example.com/page or https://example.com/document.pdf"
                    value={currentUrl}
                    onChange={(e) => setCurrentUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddUrl()}
                  />
                  <Button
                    type="button"
                    onClick={handleAddUrl}
                    disabled={!currentUrl}
                    className="gradient-primary text-white shrink-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports web pages and documents (PDF, Excel, Word).{' '}
                  <span className="text-primary cursor-pointer hover:underline">
                    View supported formats
                  </span>
                </p>
              </div>

              {urls.length > 0 && (
                <div className="space-y-2">
                  <Label>URLs to process ({urls.length})</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {urls.map((url) => (
                      <div
                        key={url}
                        className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2"
                      >
                        <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm truncate flex-1">{url}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => handleRemoveUrl(url)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg border p-4 space-y-4">
                <h4 className="font-medium">Scrape Options</h4>

                <div className="space-y-2">
                  <Label>Scrape Mode</Label>
                  <Select
                    value={config.scrapeOptions?.mode}
                    onValueChange={(value: 'single' | 'crawl') =>
                      setConfig({
                        ...config,
                        scrapeOptions: { ...config.scrapeOptions!, mode: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Page</SelectItem>
                      <SelectItem value="crawl">Crawl Site</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Change Tracking</p>
                    <p className="text-xs text-muted-foreground">
                      Detect changes on re-scrape using Firecrawl
                    </p>
                  </div>
                  <Switch
                    checked={config.scrapeOptions?.changeTracking}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        scrapeOptions: {
                          ...config.scrapeOptions!,
                          changeTracking: checked,
                        },
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">Auto-Replace on Update</p>
                    <p className="text-xs text-muted-foreground">
                      Replace existing documents when content changes
                    </p>
                  </div>
                  <Switch
                    checked={config.scrapeOptions?.autoReplace}
                    onCheckedChange={(checked) =>
                      setConfig({
                        ...config,
                        scrapeOptions: {
                          ...config.scrapeOptions!,
                          autoReplace: checked,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="font-medium mb-3">Document Parsing</h4>
                <p className="text-xs text-muted-foreground mb-3">
                  Firecrawl automatically parses these document formats
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    .pdf
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <FileSpreadsheet className="h-3 w-3" />
                    .xlsx/.xls
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <FileType className="h-3 w-3" />
                    .docx/.doc
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <FileType className="h-3 w-3" />
                    .odt/.rtf
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg border border-dashed p-8 flex flex-col items-center justify-center text-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports PDF, Word, Excel, and text files
                </p>
              </div>
            </TabsContent>

            <div className="space-y-4 pt-4 border-t mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Collection</Label>
                  <Select
                    value={config.collectionId || ''}
                    onValueChange={(value) =>
                      setConfig({ ...config, collectionId: value || undefined })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="No collection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No collection</SelectItem>
                      {collections.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Weaviate Class</Label>
                  <Select
                    value={config.weaviateClass}
                    onValueChange={(value) =>
                      setConfig({ ...config, weaviateClass: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Document">Document</SelectItem>
                      <SelectItem value="Article">Article</SelectItem>
                      <SelectItem value="FAQ">FAQ</SelectItem>
                      <SelectItem value="File">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Chunking Strategy</Label>
                <Select
                  value={config.chunkingPreset}
                  onValueChange={(value: ChunkingPreset) =>
                    setConfig({ ...config, chunkingPreset: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CHUNKING_PRESETS).map(([key, preset]) => (
                      <SelectItem key={key} value={key}>
                        {preset.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Chunk size: {selectedPreset.chunkSize} tokens, Overlap:{' '}
                  {selectedPreset.chunkOverlap} tokens
                </p>
              </div>

              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4" />
                      Advanced Chunking Options
                    </span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Custom Chunk Size (tokens)</Label>
                      <span className="text-sm text-muted-foreground">
                        {config.customChunkSize || selectedPreset.chunkSize}
                      </span>
                    </div>
                    <Slider
                      value={[config.customChunkSize || selectedPreset.chunkSize]}
                      min={128}
                      max={4096}
                      step={64}
                      onValueChange={([value]) =>
                        setConfig({ ...config, customChunkSize: value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Chunk Overlap (tokens)</Label>
                      <span className="text-sm text-muted-foreground">
                        {config.customChunkOverlap || selectedPreset.chunkOverlap}
                      </span>
                    </div>
                    <Slider
                      value={[
                        config.customChunkOverlap || selectedPreset.chunkOverlap,
                      ]}
                      min={0}
                      max={512}
                      step={16}
                      onValueChange={([value]) =>
                        setConfig({ ...config, customChunkOverlap: value })
                      }
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          </div>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isUploading}
            className="gradient-primary text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload & Process
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
