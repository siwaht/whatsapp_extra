'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  Plus,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Edit,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
  Calendar,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CreateBroadcastForm } from '@/components/broadcasts/create-broadcast-form';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Broadcast } from '@/types/database';

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-500',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
    icon: Edit,
  },
  scheduled: {
    label: 'Scheduled',
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    icon: Clock,
  },
  running: {
    label: 'Running',
    color: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    icon: Play,
  },
  paused: {
    label: 'Paused',
    color: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    icon: Pause,
  },
  completed: {
    label: 'Completed',
    color: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    color: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-slate-500',
    textColor: 'text-slate-600 dark:text-slate-400',
    bgColor: 'bg-slate-50 dark:bg-slate-900/30',
    icon: AlertCircle,
  },
};

function BroadcastCard({
  broadcast,
  onDelete,
}: {
  broadcast: Broadcast;
  onDelete: (id: string) => void;
}) {
  const status = statusConfig[broadcast.status];
  const StatusIcon = status.icon;
  const progress =
    broadcast.total_recipients > 0
      ? Math.round((broadcast.sent_count / broadcast.total_recipients) * 100)
      : 0;

  return (
    <Card className="transition-all hover:shadow-lg hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">{broadcast.name}</h3>
              <p className="text-sm text-muted-foreground">
                {broadcast.total_recipients} recipients
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <BarChart3 className="mr-2 h-4 w-4" />
                View Analytics
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {broadcast.status === 'draft' && (
                <DropdownMenuItem>
                  <Play className="mr-2 h-4 w-4" />
                  Start
                </DropdownMenuItem>
              )}
              {broadcast.status === 'running' && (
                <DropdownMenuItem>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(broadcast.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-4">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {broadcast.message_content || 'No message content'}
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {broadcast.status === 'running' && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className={cn(status.bgColor, status.textColor)}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {status.label}
          </Badge>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Send className="h-3 w-3" />
              {broadcast.sent_count}
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {broadcast.delivered_count}
            </span>
            {broadcast.failed_count > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertCircle className="h-3 w-3" />
                {broadcast.failed_count}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BroadcastList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabase();

  const { data: broadcasts, isLoading } = useQuery({
    queryKey: ['broadcasts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcasts')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Broadcast[];
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('broadcasts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Broadcast deleted successfully');
    },
  });

  const stats = {
    total: broadcasts?.length || 0,
    running: broadcasts?.filter((b) => b.status === 'running').length || 0,
    scheduled: broadcasts?.filter((b) => b.status === 'scheduled').length || 0,
    completed: broadcasts?.filter((b) => b.status === 'completed').length || 0,
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <Radio className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Broadcasts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2 text-amber-500">
                <Play className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.running}</p>
                <p className="text-sm text-muted-foreground">Running</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-500/10 p-2 text-blue-500">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.scheduled}</p>
                <p className="text-sm text-muted-foreground">Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="mt-4 h-5 w-32" />
                <Skeleton className="mt-2 h-4 w-24" />
                <Skeleton className="mt-4 h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : broadcasts && broadcasts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {broadcasts.map((broadcast) => (
            <BroadcastCard
              key={broadcast.id}
              broadcast={broadcast}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      ) : (
        <Card className="py-16">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Radio className="h-8 w-8 text-primary" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No broadcasts yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-sm">
              Create your first broadcast campaign to send messages to multiple contacts at once.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  );
}

export default function BroadcastsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (showCreateForm) {
    return (
      <div className="flex flex-col h-full">
        <CreateBroadcastForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => setShowCreateForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Header title="Broadcasts" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Broadcast Campaigns</h2>
            <p className="text-muted-foreground">
              Create and manage bulk message campaigns
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="gradient-primary text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Broadcast
          </Button>
        </div>

        <BroadcastList />
      </div>
    </div>
  );
}
