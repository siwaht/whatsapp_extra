'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  Plus,
  MoreVertical,
  WifiOff,
  RefreshCw,
  Trash2,
  QrCode,
  Settings,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  Users,
  Zap,
  Bot,
  ChevronLeft,
  ChevronRight,
  FileText,
  Webhook,
  CreditCard,
  BookOpen,
  KeyRound,
  Link2,
  BarChart3,
  Info,
  Eye,
  Shield,
  ShieldAlert,
  Activity,
  Search,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import type { InstanceConfig, Conversation, Contact, WebhookConfig, WebhookEvent } from '@/types/database';

const supabase = getSupabase();

const statusConfig = {
  open: {
    label: 'Connected',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-400',
    icon: CheckCircle2,
  },
  connecting: {
    label: 'Connecting',
    color: 'bg-amber-500',
    textColor: 'text-amber-400',
    icon: Clock,
  },
  closed: {
    label: 'Disconnected',
    color: 'bg-slate-400',
    textColor: 'text-slate-400',
    icon: WifiOff,
  },
  error: {
    label: 'Error',
    color: 'bg-red-500',
    textColor: 'text-red-400',
    icon: AlertCircle,
  },
};

interface ConversationWithContact extends Conversation {
  contact?: Contact | null;
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  return `${diffWeeks} weeks ago`;
}

function formatLogDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function LoggingSection({ instance }: { instance: InstanceConfig }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [eventFilter, setEventFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all-logs');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['webhook-events', instance.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_events')
        .select('*')
        .eq('instance_id', instance.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data as WebhookEvent[];
    },
    enabled: !!instance.id,
  });

  const { data: recentCount } = useQuery({
    queryKey: ['webhook-events-recent', instance.id],
    queryFn: async () => {
      const yesterday = new Date();
      yesterday.setHours(yesterday.getHours() - 24);

      const { count, error } = await supabase
        .from('webhook_events')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instance.id)
        .gte('created_at', yesterday.toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!instance.id,
  });

  const eventTypes = [...new Set(logs?.map((l) => l.event_type) || [])];
  const mostCommonEvent = logs?.length
    ? eventTypes.reduce((a, b) => {
        const countA = logs.filter((l) => l.event_type === a).length;
        const countB = logs.filter((l) => l.event_type === b).length;
        return countA > countB ? a : b;
      }, eventTypes[0])
    : null;
  const mostCommonCount = mostCommonEvent
    ? logs?.filter((l) => l.event_type === mostCommonEvent).length || 0
    : 0;

  const filteredLogs = logs?.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.event_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(log.payload).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = eventFilter === 'all' || log.event_type === eventFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <span className="hover:text-white cursor-pointer">Dashboard</span>
        <ChevronRight className="h-4 w-4" />
        <span className="hover:text-white cursor-pointer">Channel</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-300">{instance.instance_name}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">Logging</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{instance.instance_name}</h1>
            <Badge className="bg-slate-700 text-slate-300 border-slate-600">Channel Logs</Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          className="text-slate-400 hover:text-white"
        >
          <RefreshCw className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#1a2332] border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400 mb-1">Total Logs</p>
            <p className="text-3xl font-bold text-white">{logs?.length || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Lifetime log entries for this channel</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400 mb-1">Recent Activity</p>
            <p className="text-3xl font-bold text-white">{recentCount || 0}</p>
            <p className="text-xs text-slate-500 mt-1">Log entries in the last 24 hours</p>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-slate-700/50">
          <CardContent className="p-4">
            <p className="text-sm text-slate-400 mb-1">Most Common Event</p>
            <div className="flex items-center gap-2 mt-1">
              {mostCommonEvent && (
                <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                  {mostCommonEvent}
                </Badge>
              )}
              <span className="text-2xl font-bold text-white">{mostCommonCount}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Most frequent event type</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-[#1a2332] border-slate-700/50 mb-6">
        <CardContent className="p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white font-medium">Heads up!</p>
            <p className="text-sm text-slate-400">
              Please note that logs will be purged weekly for all users to maintain optimal system performance.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800/50">
            <TabsTrigger value="all-logs">All Logs</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#0f1419] border-slate-700 text-white w-48"
            />
          </div>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-36 bg-[#0f1419] border-slate-700 text-white">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="bg-[#1a2332] border-slate-700/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left p-4 text-sm font-medium text-slate-400">Event</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Description</th>
                <th className="text-left p-4 text-sm font-medium text-slate-400">Triggered At</th>
                <th className="text-right p-4 text-sm font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-700/30">
                    <td className="p-4">
                      <Skeleton className="h-6 w-24 bg-slate-700" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-48 bg-slate-700" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-4 w-36 bg-slate-700" />
                    </td>
                    <td className="p-4">
                      <Skeleton className="h-8 w-20 bg-slate-700 ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredLogs && filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-800/30">
                    <td className="p-4">
                      <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                        {log.event_type}
                      </Badge>
                    </td>
                    <td className="p-4 text-slate-300">
                      {log.payload && typeof log.payload === 'object'
                        ? (log.payload as any).description ||
                          (log.payload as any).action ||
                          `Receive a ${log.event_type.replace(/([A-Z])/g, ' $1').trim()}`
                        : 'Event received'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Clock className="h-4 w-4" />
                        {formatLogDate(log.created_at)}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                        <Info className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <FileText className="h-10 w-10 text-slate-600 mx-auto" />
                    <p className="text-slate-400 mt-2">No logs found</p>
                    <p className="text-slate-500 text-sm">Event logs will appear here when activity occurs</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function WebhookSection({ instance }: { instance: InstanceConfig }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['message'],
    is_active: true,
    ssl_enabled: true,
  });

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks', instance.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs')
        .select('*')
        .eq('instance_id', instance.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as WebhookConfig[];
    },
    enabled: !!instance.id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs')
        .insert({
          user_id: user!.id,
          instance_id: instance.id,
          name: newWebhook.name,
          url: newWebhook.url,
          events: newWebhook.events,
          is_active: newWebhook.is_active,
          headers: {},
          retry_count: 5,
          timeout_ms: 30000,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', instance.id] });
      setShowCreateDialog(false);
      setNewWebhook({ name: '', url: '', events: ['message'], is_active: true, ssl_enabled: true });
      toast.success('Webhook created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create webhook', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('webhook_configs').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', instance.id] });
      toast.success('Webhook deleted');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('webhook_configs')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhooks', instance.id] });
    },
  });

  const activeCount = webhooks?.filter((w) => w.is_active).length || 0;
  const sslCount = webhooks?.filter((w) => w.url.startsWith('https://')).length || 0;
  const eventTypes = [...new Set(webhooks?.flatMap((w) => w.events) || [])].length;

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
        <span className="hover:text-white cursor-pointer">Dashboard</span>
        <ChevronRight className="h-4 w-4" />
        <span className="hover:text-white cursor-pointer">Channel</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-slate-300">{instance.instance_name}</span>
        <ChevronRight className="h-4 w-4" />
        <span className="text-white">Webhook</span>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{instance.instance_name}</h1>
            <Badge className="bg-primary/20 text-primary border-primary/30">
              <Webhook className="h-3 w-3 mr-1" />
              Webhooks
            </Badge>
          </div>
          <p className="text-slate-400 mt-1">Manage webhook endpoints for real-time event notifications</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-primary">{activeCount} Active Webhooks</span>
          <Button onClick={() => setShowCreateDialog(true)} className="gradient-primary text-white">
            <Plus className="mr-2 h-4 w-4" />
            Create Webhook
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="bg-[#1a2332] border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-slate-400">Active Webhooks</p>
                <p className="text-2xl font-bold text-white">{activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-slate-400">Event Types</p>
                <p className="text-2xl font-bold text-white">{eventTypes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#1a2332] border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-emerald-400" />
              <div>
                <p className="text-sm text-slate-400">SSL Secured</p>
                <p className="text-2xl font-bold text-white">{sslCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          [...Array(2)].map((_, i) => (
            <Card key={i} className="bg-[#1a2332] border-slate-700/50">
              <CardContent className="p-6">
                <Skeleton className="h-6 w-48 bg-slate-700" />
                <Skeleton className="h-4 w-96 mt-2 bg-slate-700" />
              </CardContent>
            </Card>
          ))
        ) : webhooks && webhooks.length > 0 ? (
          webhooks.map((webhook) => {
            const isSSL = webhook.url.startsWith('https://');
            return (
              <Card key={webhook.id} className="bg-[#1a2332] border-slate-700/50">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-primary">
                      <Webhook className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-slate-700 text-slate-300 text-[10px] px-1.5">POST</Badge>
                        <Badge
                          className={cn(
                            'text-[10px] px-1.5',
                            isSSL
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          )}
                        >
                          {isSSL ? 'Healthy' : 'SSL Warning'}
                        </Badge>
                      </div>
                      <h3 className="text-white font-medium">{webhook.name || 'Message'}</h3>
                      <p className="text-slate-400 text-sm mt-0.5">{webhook.url}</p>

                      <div className="grid grid-cols-4 gap-4 mt-4 py-3 px-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Clock className="h-4 w-4" />
                          <span>{(webhook.timeout_ms || 30000) / 1000}s</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-400">
                          <Activity className="h-4 w-4" />
                          <span>{webhook.retry_count || 5}x</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          {isSSL ? (
                            <>
                              <Shield className="h-4 w-4 text-emerald-400" />
                              <span className="text-slate-400">SSL</span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className="h-4 w-4 text-amber-400" />
                              <span className="text-slate-400">No SSL</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              webhook.is_active ? 'bg-emerald-500' : 'bg-amber-500'
                            )}
                          />
                          <span className={webhook.is_active ? 'text-emerald-400' : 'text-amber-400'}>
                            {webhook.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <span className="text-xs text-slate-500">
                          Created {new Date(webhook.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => toggleMutation.mutate({ id: webhook.id, is_active: !webhook.is_active })}
                        >
                          {webhook.is_active ? 'Disable' : 'Enable'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-400"
                          onClick={() => {
                            if (confirm('Delete this webhook?')) {
                              deleteMutation.mutate(webhook.id);
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card className="bg-[#1a2332] border-slate-700/50 py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/20 p-4">
                <Webhook className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">No webhooks configured</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">
                Create your first webhook to receive real-time notifications
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-6 gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Webhook
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1a2332] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create Webhook</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure a new webhook endpoint for real-time notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Webhook Name</Label>
              <Input
                placeholder="e.g., Message Notifications"
                value={newWebhook.name}
                onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                className="bg-[#0f1419] border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Webhook URL</Label>
              <Input
                placeholder="https://your-server.com/webhook"
                value={newWebhook.url}
                onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                className="bg-[#0f1419] border-slate-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Event Type</Label>
              <Select
                value={newWebhook.events[0]}
                onValueChange={(v) => setNewWebhook({ ...newWebhook, events: [v] })}
              >
                <SelectTrigger className="bg-[#0f1419] border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">Message</SelectItem>
                  <SelectItem value="message.status">Message Status</SelectItem>
                  <SelectItem value="connection">Connection</SelectItem>
                  <SelectItem value="contact">Contact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-slate-300">Active on creation</Label>
              <Switch
                checked={newWebhook.is_active}
                onCheckedChange={(v) => setNewWebhook({ ...newWebhook, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!newWebhook.name || !newWebhook.url || createMutation.isPending}
              className="gradient-primary text-white"
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InstanceDetailView({
  instance,
  onBack,
}: {
  instance: InstanceConfig;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const status = statusConfig[instance.status];
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSidebarItem, setActiveSidebarItem] = useState('details');

  const { data: conversations } = useQuery({
    queryKey: ['instance-conversations', instance.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversations')
        .select(`*, contact:contacts(*)`)
        .eq('instance_id', instance.id)
        .order('last_message_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as ConversationWithContact[];
    },
    enabled: !!instance.id,
  });

  const { data: contactCount } = useQuery({
    queryKey: ['instance-contact-count', instance.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('instance_id', instance.id);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!instance.id,
  });

  const sidebarTools = [
    { id: 'otp-code', label: 'OTP Code', icon: KeyRound },
    { id: 'otp-link', label: 'OTP Link', icon: Link2 },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'auto-responder', label: 'Auto-Responder', icon: Bot },
  ];

  const sidebarConfig = [
    { id: 'logging', label: 'Logging', icon: FileText },
    { id: 'webhook', label: 'Webhook', icon: Webhook },
    { id: 'setting', label: 'Setting', icon: Settings },
    { id: 'billing', label: 'Billing', icon: CreditCard },
  ];

  const renderContent = () => {
    if (activeSidebarItem === 'webhook') {
      return <WebhookSection instance={instance} />;
    }

    if (activeSidebarItem === 'logging') {
      return <LoggingSection instance={instance} />;
    }

    if (activeSidebarItem === 'otp-code') {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <span className="hover:text-white cursor-pointer">Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="hover:text-white cursor-pointer">Channel</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{instance.instance_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">OTP Code</span>
          </div>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-12 text-center">
              <KeyRound className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">OTP Code Management</h3>
              <p className="text-slate-400">Generate and manage one-time passwords for authentication</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSidebarItem === 'otp-link') {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <span className="hover:text-white cursor-pointer">Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="hover:text-white cursor-pointer">Channel</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{instance.instance_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">OTP Link</span>
          </div>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Link2 className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">OTP Link Generation</h3>
              <p className="text-slate-400">Create secure one-time password links for users</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSidebarItem === 'contacts') {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <span className="hover:text-white cursor-pointer">Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="hover:text-white cursor-pointer">Channel</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{instance.instance_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Contacts</span>
          </div>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Contact Management</h3>
              <p className="text-slate-400">View and manage contacts for this instance</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSidebarItem === 'auto-responder') {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <span className="hover:text-white cursor-pointer">Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="hover:text-white cursor-pointer">Channel</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{instance.instance_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Auto-Responder</span>
          </div>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Bot className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Auto-Responder</h3>
              <p className="text-slate-400">Configure automated message responses</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSidebarItem === 'setting') {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <span className="hover:text-white cursor-pointer">Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="hover:text-white cursor-pointer">Channel</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{instance.instance_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Setting</span>
          </div>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Settings className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Instance Settings</h3>
              <p className="text-slate-400">Configure instance settings and preferences</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    if (activeSidebarItem === 'billing') {
      return (
        <div className="p-6">
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <span className="hover:text-white cursor-pointer">Dashboard</span>
            <ChevronRight className="h-4 w-4" />
            <span className="hover:text-white cursor-pointer">Channel</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-slate-300">{instance.instance_name}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-white">Billing</span>
          </div>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Billing & Usage</h3>
              <p className="text-slate-400">View billing information and usage statistics</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
          <button onClick={onBack} className="hover:text-white">Dashboard</button>
          <ChevronRight className="h-4 w-4" />
          <button onClick={onBack} className="hover:text-white">Channel</button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-300">{instance.instance_name}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">Details</span>
        </div>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                {instance.phone_label || instance.instance_name}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <Badge className={cn('text-xs', status.color === 'bg-emerald-500' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-500/20 text-slate-400')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5', status.color)} />
                  {status.label}
                </Badge>
                {instance.phone_number && (
                  <span className="text-slate-400 text-sm">{instance.phone_number}</span>
                )}
              </div>
            </div>
          </div>
          <Button variant="outline" className="border-slate-700 text-slate-300 hover:text-white">
            <Zap className="mr-2 h-4 w-4" />
            Generate Token
          </Button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-4">
              <MessageSquare className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-slate-400">Messages</p>
              <p className="text-2xl font-bold text-white">
                ∞
              </p>
              <p className="text-xs text-slate-500 mt-1">Unlimited messaging</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-slate-400">Contacts</p>
              <p className="text-2xl font-bold text-white">{contactCount || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Total contacts reached</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-4">
              <Zap className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-slate-400">API Requests</p>
              <p className="text-2xl font-bold text-white">
                ∞
              </p>
              <p className="text-xs text-slate-500 mt-1">Unlimited API calls</p>
            </CardContent>
          </Card>
          <Card className="bg-[#1a2332] border-slate-700/50">
            <CardContent className="p-4">
              <Bot className="h-5 w-5 text-primary mb-3" />
              <p className="text-sm text-slate-400">Auto Responder</p>
              <p className="text-2xl font-bold text-white">Disabled</p>
              <p className="text-xs text-slate-500 mt-1">Auto response system</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-transparent border-b border-slate-700/50 rounded-none p-0 h-auto">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              <Info className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="details"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
            >
              <Settings className="h-4 w-4 mr-2" />
              Details
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <Card className="bg-[#1a2332] border-slate-700/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recent Conversations</h3>
                    <p className="text-sm text-slate-400">Latest messages from your contacts</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="link" className="text-primary">
                      View All <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-1">
                  {conversations && conversations.length > 0 ? (
                    conversations.map((conv) => {
                      const name =
                        conv.contact?.name ||
                        conv.contact?.push_name ||
                        conv.remote_jid.replace('@s.whatsapp.net', '');
                      return (
                        <div
                          key={conv.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-800/50 transition-colors"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.contact?.profile_picture_url || ''} />
                            <AvatarFallback className="bg-slate-600 text-white text-sm">
                              {name[0]?.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{name}</span>
                              <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-emerald-500/20 text-emerald-400 border-0">
                                WhatsApp
                              </Badge>
                              {conv.last_message_at && (
                                <span className="text-xs text-slate-500 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimeAgo(conv.last_message_at)}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-primary truncate mt-0.5">
                              {conv.last_message_preview || 'No message content'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-10 w-10 text-slate-600 mx-auto" />
                      <p className="text-slate-400 mt-2">No conversations yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="bg-[#1a2332] border-slate-700/50">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Activity Log</h3>
                <p className="text-slate-400">Activity tracking coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="details" className="mt-6">
            <Card className="bg-[#1a2332] border-slate-700/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-lg font-semibold text-white mb-4">Instance Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Instance Name</p>
                    <p className="text-white">{instance.instance_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Phone Number</p>
                    <p className="text-white">{instance.phone_number || 'Not connected'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Status</p>
                    <p className={status.textColor}>{status.label}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Created</p>
                    <p className="text-white">
                      {new Date(instance.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Last Activity</p>
                    <p className="text-white">
                      {instance.last_activity_at
                        ? new Date(instance.last_activity_at).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Evolution API URL</p>
                    <p className="text-white text-sm truncate">
                      {instance.evolution_api_url || 'Not configured'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="flex h-full">
      <div className="w-[200px] border-r border-slate-700/50 bg-[#0f1419] flex flex-col">
        <div className="p-4 border-b border-slate-700/50">
          <button
            onClick={() => setActiveSidebarItem('details')}
            className={cn(
              'flex items-center gap-2 text-sm font-medium w-full px-2 py-1.5 rounded',
              activeSidebarItem === 'details' ? 'text-white bg-slate-800' : 'text-slate-400 hover:text-white'
            )}
          >
            <Settings className="h-4 w-4" />
            Details
          </button>
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Tools</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-slate-700">4</Badge>
          </div>
          {sidebarTools.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarItem(item.id)}
              className={cn(
                'flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded transition-colors',
                activeSidebarItem === item.id
                  ? 'text-white bg-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 space-y-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Configuration</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-slate-700">4</Badge>
          </div>
          {sidebarConfig.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSidebarItem(item.id)}
              className={cn(
                'flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded transition-colors',
                activeSidebarItem === item.id
                  ? 'text-white bg-slate-800'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-auto p-4 space-y-2 border-t border-slate-700/50">
          <button className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-1.5">
            <BookOpen className="h-4 w-4" />
            API Documentation
          </button>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white w-full px-2 py-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Channel
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">{renderContent()}</div>
    </div>
  );
}

function InstanceCard({
  instance,
  onSelect,
  onConnect,
  onDelete,
  onRestart,
}: {
  instance: InstanceConfig;
  onSelect: () => void;
  onConnect: (id: string) => void;
  onDelete: (id: string) => void;
  onRestart?: (id: string) => void;
}) {
  const status = statusConfig[instance.status];
  const StatusIcon = status.icon;

  return (
    <Card
      className="group cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 bg-[#1a2332] border-slate-700/50"
      onClick={onSelect}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110',
                instance.status === 'open'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-slate-700 text-slate-400'
              )}
            >
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{instance.instance_name}</h3>
              <p className="text-sm text-slate-400">
                {instance.phone_number || 'No phone connected'}
              </p>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {instance.status !== 'open' && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onConnect(instance.id); }}>
                  <QrCode className="mr-2 h-4 w-4" />
                  Connect
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onRestart?.(instance.id); }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Restart
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete(instance.id); }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge className={cn('text-xs', status.color === 'bg-emerald-500' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-700 text-slate-400 border-slate-600')}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
          {instance.last_activity_at && (
            <span className="text-xs text-slate-500">
              Last active: {new Date(instance.last_activity_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InstanceSkeleton() {
  return (
    <Card className="bg-[#1a2332] border-slate-700/50">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-700" />
            <div>
              <Skeleton className="h-5 w-32 bg-slate-700" />
              <Skeleton className="mt-2 h-4 w-24 bg-slate-700" />
            </div>
          </div>
          <Skeleton className="h-8 w-8 rounded-md bg-slate-700" />
        </div>
        <div className="mt-4 flex items-center justify-between">
          <Skeleton className="h-6 w-24 rounded-full bg-slate-700" />
          <Skeleton className="h-4 w-32 bg-slate-700" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function InstancesPage() {
  const { user, session, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connectingQr, setConnectingQr] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token}`,
  });

  const { data: instances, isLoading } = useQuery({
    queryKey: ['instances', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instance_configs')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as InstanceConfig[];
    },
    enabled: !!user?.id,
  });

  const selectedInstance = instances?.find((i) => i.id === selectedInstanceId);

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhooks`;

      const response = await fetch('/api/instances', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          instanceName: name,
          webhookUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create instance in Evolution API');
      }

      const instanceUrl = `${user.profile.evolution_api_url}/manager`;

      const { data, error } = await supabase
        .from('instance_configs')
        .insert({
          user_id: user!.id,
          instance_name: name,
          status: result.instance?.status || 'close',
          evolution_api_url: instanceUrl,
          phone_number: result.instance?.owner || null,
        })
        .select()
        .single();

      if (error) throw error;
      return { db: data, evolution: result };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      setShowCreateDialog(false);
      setNewInstanceName('');

      if (result.evolution.qrcode?.base64) {
        setSelectedInstanceId(result.db.id);
        setQrCode(result.evolution.qrcode.base64);
        setShowConnectDialog(true);
        toast.success('Instance created! Scan QR code to connect');
      } else {
        toast.success('Instance created successfully');
      }
    },
    onError: (error) => {
      toast.error('Failed to create instance', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const instance = instances?.find((i) => i.id === id);

      if (instance?.instance_name) {
        try {
          await fetch('/api/instances/delete', {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ instanceName: instance.instance_name }),
          });
        } catch (error) {
          logger.warn('Failed to delete from Evolution API:', error);
        }
      }

      const { error } = await supabase.from('instance_configs').delete().eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast.success('Instance deleted successfully');
    },
  });

  const handleConnect = async (id: string) => {
    const instance = instances?.find((i) => i.id === id);
    if (!instance) return;

    setSelectedInstanceId(id);
    setShowConnectDialog(true);
    setConnectingQr(true);
    setQrCode(null);

    try {
      const response = await fetch(`/api/instances/connect`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ instanceName: instance.instance_name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get QR code');
      }

      if (data.qrcode?.base64) {
        setQrCode(data.qrcode.base64);
      }
    } catch (error) {
      toast.error('Failed to generate QR code');
      setShowConnectDialog(false);
    } finally {
      setConnectingQr(false);
    }
  };

  const handleRestart = async (id: string) => {
    const instance = instances?.find((i) => i.id === id);
    if (!instance) return;

    try {
      const response = await fetch(`/api/instances/restart`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ instanceName: instance.instance_name }),
      });

      if (!response.ok) throw new Error('Failed to restart');

      toast.success('Instance restarted successfully');
      queryClient.invalidateQueries({ queryKey: ['instances'] });
    } catch (error) {
      toast.error('Failed to restart instance');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this instance?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/instances/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      await queryClient.invalidateQueries({ queryKey: ['instances'] });
      toast.success(data.synced > 0 ? `Synced ${data.synced} instance(s)` : 'All instances are up to date');
    } catch (error) {
      toast.error('Failed to sync instances');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (instances && instances.length > 0 && !syncing) {
      const syncOnLoad = async () => {
        try {
          const response = await fetch('/api/instances/sync', {
            method: 'POST',
            headers: getAuthHeaders(),
          });

          if (response.ok) {
            await queryClient.invalidateQueries({ queryKey: ['instances'] });
          }
        } catch (error) {
        }
      };

      syncOnLoad();
    }
  }, [instances?.length]);

  if (selectedInstance) {
    return (
      <div className="flex flex-col h-screen bg-[#111b21]">
        <InstanceDetailView
          instance={selectedInstance}
          onBack={() => setSelectedInstanceId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-[#111b21] min-h-screen">
      <Header title="Instances" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">WhatsApp Instances</h2>
            <p className="text-slate-400">Manage your connected WhatsApp numbers</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="border-slate-700 text-slate-300 hover:text-white"
            >
              {syncing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Sync
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Instance
            </Button>
          </div>
        </div>

        {isLoading || authLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <InstanceSkeleton key={i} />
            ))}
          </div>
        ) : instances && instances.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {instances.map((instance) => (
              <InstanceCard
                key={instance.id}
                instance={instance}
                onSelect={() => setSelectedInstanceId(instance.id)}
                onConnect={handleConnect}
                onDelete={handleDelete}
                onRestart={handleRestart}
              />
            ))}
          </div>
        ) : (
          <Card className="py-16 bg-[#1a2332] border-slate-700/50">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-primary/20 p-4">
                <Smartphone className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">No instances yet</h3>
              <p className="mt-2 text-sm text-slate-400 max-w-sm">
                Create your first WhatsApp instance to start managing conversations.
              </p>
              <Button onClick={() => setShowCreateDialog(true)} className="mt-6 gradient-primary text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Instance
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#1a2332] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Instance</DialogTitle>
            <DialogDescription className="text-slate-400">
              Add a new WhatsApp instance to manage conversations
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Instance Name</Label>
              <Input
                id="name"
                placeholder="e.g., Sales Team, Support"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                className="bg-[#0f1419] border-slate-700 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} className="border-slate-700 text-slate-300">
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newInstanceName)}
              disabled={!newInstanceName || createMutation.isPending}
              className="gradient-primary text-white"
            >
              {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Instance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent className="sm:max-w-lg bg-[#1a2332] border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Connect WhatsApp</DialogTitle>
            <DialogDescription className="text-slate-400">
              Scan this QR code with your WhatsApp app to connect
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6">
            {connectingQr ? (
              <div className="flex h-64 w-64 sm:h-80 sm:w-80 items-center justify-center rounded-xl border-2 border-dashed border-slate-600">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : qrCode ? (
              <div className="rounded-xl border-4 border-primary/20 p-3 sm:p-4 bg-white shadow-2xl">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="h-64 w-64 sm:h-80 sm:w-80"
                  style={{ imageRendering: 'pixelated' }}
                />
              </div>
            ) : (
              <div className="flex h-64 w-64 sm:h-80 sm:w-80 items-center justify-center rounded-xl border-2 border-dashed border-slate-600 text-slate-400 text-sm">
                Failed to load QR code
              </div>
            )}
            <p className="mt-4 text-sm text-slate-400 text-center px-4">
              Open WhatsApp &gt; Settings &gt; Linked Devices &gt; Link a Device
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)} className="w-full border-slate-700 text-slate-300">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
