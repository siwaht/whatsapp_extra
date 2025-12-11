'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bot,
  Plus,
  MoreVertical,
  Trash2,
  Edit,
  Play,
  Pause,
  Wrench,
  Zap,
  Brain,
  BookOpen,
  Link2,
  Unlink,
  FolderOpen,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { AIAgent, AITool, KnowledgeCollection } from '@/types/database';

const models = [
  { value: 'gpt-4', label: 'GPT-4' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { value: 'claude-3-opus', label: 'Claude 3 Opus' },
  { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
];

interface AgentWithLinks extends AIAgent {
  knowledge_links?: { collection: KnowledgeCollection }[];
}

function AgentCard({
  agent,
  onEdit,
  onDelete,
  onToggle,
  onManageKnowledge,
}: {
  agent: AgentWithLinks;
  onEdit: (agent: AIAgent) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, active: boolean) => void;
  onManageKnowledge: (agent: AIAgent) => void;
}) {
  const linkedCollections = agent.knowledge_links?.length || 0;

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-all',
                agent.is_active
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Bot className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{agent.name}</h3>
                {agent.is_active && (
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{agent.model}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(agent)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onManageKnowledge(agent)}>
                <BookOpen className="mr-2 h-4 w-4" />
                Knowledge Base
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggle(agent.id, !agent.is_active)}>
                {agent.is_active ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wrench className="mr-2 h-4 w-4" />
                Manage Tools
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(agent.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <p className="mt-4 text-sm text-muted-foreground line-clamp-2">
          {agent.description || 'No description'}
        </p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            Temp: {agent.temperature}
          </span>
          <span className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            Max: {agent.max_tokens}
          </span>
          {linkedCollections > 0 && (
            <span className="flex items-center gap-1 text-primary">
              <BookOpen className="h-3 w-3" />
              {linkedCollections} collection{linkedCollections !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t pt-4">
          <span className="text-sm text-muted-foreground">Status</span>
          <Switch
            checked={agent.is_active}
            onCheckedChange={(checked) => onToggle(agent.id, checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function AIAgentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabase();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [knowledgeAgent, setKnowledgeAgent] = useState<AIAgent | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [newAgent, setNewAgent] = useState({
    name: '',
    description: '',
    system_prompt: '',
    model: 'gpt-4',
    temperature: 0.7,
    max_tokens: 2048,
  });

  const { data: agents, isLoading } = useQuery({
    queryKey: ['ai-agents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_agents')
        .select(`
          *,
          knowledge_links:agent_knowledge_links(
            collection:knowledge_collections(*)
          )
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AgentWithLinks[];
    },
    enabled: !!user?.id,
  });

  const { data: collections } = useQuery({
    queryKey: ['knowledge-collections', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('knowledge_collections')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;
      return data as KnowledgeCollection[];
    },
    enabled: !!user?.id,
  });

  const { data: agentLinks } = useQuery({
    queryKey: ['agent-knowledge-links', knowledgeAgent?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_knowledge_links')
        .select('collection_id')
        .eq('agent_id', knowledgeAgent!.id);

      if (error) throw error;
      return data.map((link) => link.collection_id);
    },
    enabled: !!knowledgeAgent?.id,
  });

  const { data: tools } = useQuery({
    queryKey: ['ai-tools', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_tools')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as AITool[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (agent: typeof newAgent) => {
      const { data, error } = await supabase
        .from('ai_agents')
        .insert({
          user_id: user!.id,
          name: agent.name,
          description: agent.description,
          system_prompt: agent.system_prompt,
          model: agent.model,
          temperature: agent.temperature,
          max_tokens: agent.max_tokens,
          is_active: false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      setShowCreateDialog(false);
      resetForm();
      toast.success('Agent created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create agent', { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<AIAgent> & { id: string }) => {
      const { error } = await supabase
        .from('ai_agents')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      setEditingAgent(null);
      toast.success('Agent updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await getSupabase().from('ai_agents').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      toast.success('Agent deleted successfully');
    },
  });

  const updateKnowledgeLinksMutation = useMutation({
    mutationFn: async ({
      agentId,
      collectionIds,
    }: {
      agentId: string;
      collectionIds: string[];
    }) => {
      const { error: deleteError } = await supabase
        .from('agent_knowledge_links')
        .delete()
        .eq('agent_id', agentId);

      if (deleteError) throw deleteError;

      if (collectionIds.length > 0) {
        const links = collectionIds.map((collectionId) => ({
          agent_id: agentId,
          collection_id: collectionId,
        }));

        const { error: insertError } = await supabase
          .from('agent_knowledge_links')
          .insert(links);

        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent-knowledge-links'] });
      setKnowledgeAgent(null);
      setSelectedCollections([]);
      toast.success('Knowledge collections updated');
    },
    onError: (error) => {
      toast.error('Failed to update knowledge', { description: error.message });
    },
  });

  const resetForm = () => {
    setNewAgent({
      name: '',
      description: '',
      system_prompt: '',
      model: 'gpt-4',
      temperature: 0.7,
      max_tokens: 2048,
    });
  };

  const handleToggle = (id: string, active: boolean) => {
    updateMutation.mutate({ id, is_active: active });
  };

  const handleManageKnowledge = (agent: AIAgent) => {
    setKnowledgeAgent(agent);
    setSelectedCollections(agentLinks || []);
  };

  const handleSaveKnowledgeLinks = () => {
    if (!knowledgeAgent) return;
    updateKnowledgeLinksMutation.mutate({
      agentId: knowledgeAgent.id,
      collectionIds: selectedCollections,
    });
  };

  const toggleCollection = (collectionId: string) => {
    setSelectedCollections((prev) =>
      prev.includes(collectionId)
        ? prev.filter((id) => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  return (
    <div className="flex flex-col">
      <Header title="AI Agents" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Agents</h2>
            <p className="text-muted-foreground">
              Create and manage AI-powered conversation agents
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Button>
        </div>

        <Tabs defaultValue="agents">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="agents" className="mt-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div>
                          <Skeleton className="h-5 w-24" />
                          <Skeleton className="mt-2 h-4 w-16" />
                        </div>
                      </div>
                      <Skeleton className="mt-4 h-12 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : agents && agents.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {agents.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    onEdit={setEditingAgent}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onToggle={handleToggle}
                    onManageKnowledge={handleManageKnowledge}
                  />
                ))}
              </div>
            ) : (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">No agents yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                    Create your first AI agent to automate conversations and provide
                    intelligent responses.
                  </p>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="mt-6 gradient-primary text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tools" className="mt-6">
            <Card className="py-16">
              <CardContent className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-4">
                  <Wrench className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">MCP Tools</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Configure tools that your AI agents can use to perform actions
                  like database lookups, API calls, and more.
                </p>
                <Button className="mt-6" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tool
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog
        open={showCreateDialog || !!editingAgent}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateDialog(false);
            setEditingAgent(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingAgent ? 'Edit Agent' : 'Create AI Agent'}
            </DialogTitle>
            <DialogDescription>
              {editingAgent
                ? 'Update your AI agent configuration'
                : 'Configure a new AI agent for automated conversations'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="space-y-2">
              <Label htmlFor="name">Agent Name</Label>
              <Input
                id="name"
                placeholder="e.g., Support Assistant"
                value={editingAgent?.name || newAgent.name}
                onChange={(e) =>
                  editingAgent
                    ? setEditingAgent({ ...editingAgent, name: e.target.value })
                    : setNewAgent((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Brief description of what this agent does"
                value={editingAgent?.description || newAgent.description}
                onChange={(e) =>
                  editingAgent
                    ? setEditingAgent({ ...editingAgent, description: e.target.value })
                    : setNewAgent((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select
                value={editingAgent?.model || newAgent.model}
                onValueChange={(value) =>
                  editingAgent
                    ? setEditingAgent({ ...editingAgent, model: value })
                    : setNewAgent((prev) => ({ ...prev, model: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Instructions for how the agent should behave..."
                rows={4}
                value={editingAgent?.system_prompt || newAgent.system_prompt}
                onChange={(e) =>
                  editingAgent
                    ? setEditingAgent({ ...editingAgent, system_prompt: e.target.value })
                    : setNewAgent((prev) => ({ ...prev, system_prompt: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Temperature: {editingAgent?.temperature || newAgent.temperature}</Label>
              </div>
              <Slider
                value={[editingAgent?.temperature || newAgent.temperature]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([value]) =>
                  editingAgent
                    ? setEditingAgent({ ...editingAgent, temperature: value })
                    : setNewAgent((prev) => ({ ...prev, temperature: value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Lower values make output more focused, higher values more creative
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tokens">Max Tokens</Label>
              <Input
                id="tokens"
                type="number"
                value={editingAgent?.max_tokens || newAgent.max_tokens}
                onChange={(e) =>
                  editingAgent
                    ? setEditingAgent({
                        ...editingAgent,
                        max_tokens: parseInt(e.target.value),
                      })
                    : setNewAgent((prev) => ({
                        ...prev,
                        max_tokens: parseInt(e.target.value),
                      }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setEditingAgent(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                editingAgent
                  ? updateMutation.mutate({
                      id: editingAgent.id,
                      name: editingAgent.name,
                      description: editingAgent.description,
                      system_prompt: editingAgent.system_prompt,
                      model: editingAgent.model,
                      temperature: editingAgent.temperature,
                      max_tokens: editingAgent.max_tokens,
                    })
                  : createMutation.mutate(newAgent)
              }
              disabled={
                !(editingAgent?.name || newAgent.name) ||
                createMutation.isPending ||
                updateMutation.isPending
              }
              className="gradient-primary text-white"
            >
              {editingAgent ? 'Update Agent' : 'Create Agent'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!knowledgeAgent}
        onOpenChange={(open) => {
          if (!open) {
            setKnowledgeAgent(null);
            setSelectedCollections([]);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Knowledge Base
            </DialogTitle>
            <DialogDescription>
              Link knowledge collections to {knowledgeAgent?.name} for RAG-powered responses
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {collections && collections.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {collections.map((collection) => {
                  const isLinked = selectedCollections.includes(collection.id);
                  return (
                    <div
                      key={collection.id}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border p-4 cursor-pointer transition-all',
                        isLinked
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-muted-foreground/50'
                      )}
                      onClick={() => toggleCollection(collection.id)}
                    >
                      <Checkbox
                        checked={isLinked}
                        onCheckedChange={() => toggleCollection(collection.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{collection.name}</span>
                        </div>
                        {collection.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {collection.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {collection.document_count} document{collection.document_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      {isLinked && (
                        <Badge className="bg-primary/10 text-primary">Linked</Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="py-8">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-muted p-3">
                    <FolderOpen className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h4 className="mt-3 font-medium">No Collections</h4>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create a knowledge collection first to link it to this agent
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setKnowledgeAgent(null);
                setSelectedCollections([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveKnowledgeLinks}
              disabled={updateKnowledgeLinksMutation.isPending}
              className="gradient-primary text-white"
            >
              {updateKnowledgeLinksMutation.isPending ? 'Saving...' : 'Save Links'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}