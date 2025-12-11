'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Smartphone,
  MessageSquare,
  Users,
  Radio,
  TrendingUp,
  Plus,
  ArrowRight,
  Zap,
  ArrowUpRight,
  Activity,
  Sparkles,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: React.ReactNode;
  isLoading?: boolean;
  gradient?: string;
  delay?: number;
}

function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  isLoading,
  gradient = 'from-primary/10 to-cyan-500/10',
  delay = 0,
}: StatCardProps) {
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-slate-200/60 dark:border-slate-800/60">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24 rounded-md" />
              <Skeleton className="h-9 w-20 rounded-md" />
              <Skeleton className="h-3 w-16 rounded-md" />
            </div>
            <Skeleton className="h-14 w-14 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-slate-200/60 dark:border-slate-800/60',
        'transition-all duration-500 ease-out hover:shadow-xl hover:shadow-slate-900/5 dark:hover:shadow-black/20',
        'hover:-translate-y-1 hover:border-primary/20 group',
        'opacity-0 animate-fade-in'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      <div className={cn(
        'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
        gradient
      )} />
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />

      <CardContent className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {title}
            </p>
            <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {value}
            </p>
            {change && (
              <div className="flex items-center gap-1 pt-1">
                {changeType === 'positive' && (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                )}
                <p
                  className={cn(
                    'text-xs font-medium',
                    changeType === 'positive' && 'text-emerald-600 dark:text-emerald-400',
                    changeType === 'negative' && 'text-red-600 dark:text-red-400',
                    changeType === 'neutral' && 'text-slate-500 dark:text-slate-400'
                  )}
                >
                  {change}
                </p>
              </div>
            )}
          </div>
          <div className={cn(
            'rounded-xl p-3.5 transition-all duration-300',
            'bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-800/50',
            'group-hover:from-primary/20 group-hover:to-cyan-500/10',
            'group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/10'
          )}>
            <div className="text-slate-600 dark:text-slate-400 group-hover:text-primary transition-colors">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      const [instances, contacts, conversations, broadcasts] = await Promise.all([
        supabase
          .from('instance_configs')
          .select('id, status', { count: 'exact' })
          .eq('user_id', user!.id),
        supabase
          .from('contacts')
          .select('id', { count: 'exact' })
          .eq('user_id', user!.id),
        supabase
          .from('conversations')
          .select('id', { count: 'exact' })
          .eq('user_id', user!.id),
        supabase
          .from('broadcasts')
          .select('id, status', { count: 'exact' })
          .eq('user_id', user!.id),
      ]);

      const activeInstances =
        instances.data?.filter((i) => i.status === 'open').length || 0;

      return {
        totalInstances: instances.count || 0,
        activeInstances,
        totalContacts: contacts.count || 0,
        totalConversations: conversations.count || 0,
        totalBroadcasts: broadcasts.count || 0,
      };
    },
    enabled: !!user?.id,
  });

  const { data: messageStats } = useQuery({
    queryKey: ['message-stats', user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('message_stats')
        .select('*')
        .eq('user_id', user!.id)
        .order('stat_date', { ascending: true })
        .limit(7);

      return data || [];
    },
    enabled: !!user?.id,
  });

  const chartData =
    messageStats?.map((stat) => ({
      date: new Date(stat.stat_date).toLocaleDateString('en-US', {
        weekday: 'short',
      }),
      sent: stat.messages_sent,
      received: stat.messages_received,
    })) || [];

  const quickActions = [
    {
      title: 'Create Instance',
      description: 'Connect a new WhatsApp number',
      href: '/instances?action=create',
      icon: Smartphone,
      color: 'text-teal-500',
      bgColor: 'bg-teal-500/10',
    },
    {
      title: 'New Broadcast',
      description: 'Send bulk messages',
      href: '/broadcasts?action=create',
      icon: Radio,
      color: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'View Conversations',
      description: 'Check recent messages',
      href: '/conversations',
      icon: MessageSquare,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
    },
  ];

  const firstName = user?.profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between opacity-0 animate-fade-in" style={{ animationFillMode: 'forwards' }}>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Welcome back, {firstName}
              </h2>
              <Sparkles className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-slate-500 dark:text-slate-400">
              Here&apos;s what&apos;s happening with your WhatsApp channels today
            </p>
          </div>
          <Button
            asChild
            className="btn-primary w-fit"
          >
            <Link href="/instances?action=create">
              <Plus className="mr-2 h-4 w-4" />
              New Instance
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Instances"
            value={stats?.totalInstances || 0}
            change={`${stats?.activeInstances || 0} active`}
            changeType="positive"
            icon={<Smartphone className="h-6 w-6" />}
            isLoading={statsLoading}
            delay={100}
          />
          <StatCard
            title="Total Contacts"
            value={stats?.totalContacts || 0}
            icon={<Users className="h-6 w-6" />}
            isLoading={statsLoading}
            gradient="from-cyan-500/10 to-blue-500/10"
            delay={150}
          />
          <StatCard
            title="Conversations"
            value={stats?.totalConversations || 0}
            icon={<MessageSquare className="h-6 w-6" />}
            isLoading={statsLoading}
            gradient="from-emerald-500/10 to-teal-500/10"
            delay={200}
          />
          <StatCard
            title="Broadcasts"
            value={stats?.totalBroadcasts || 0}
            icon={<Radio className="h-6 w-6" />}
            isLoading={statsLoading}
            gradient="from-amber-500/10 to-orange-500/10"
            delay={250}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 border-slate-200/60 dark:border-slate-800/60 overflow-hidden opacity-0 animate-fade-in" style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                Message Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {chartData.length > 0 ? (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="hsl(168 76% 40%)"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(168 76% 40%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorReceived"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(199 89% 48%)"
                            stopOpacity={0.4}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(199 89% 48%)"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                        }}
                        labelStyle={{
                          fontWeight: 600,
                          marginBottom: '4px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="sent"
                        stroke="hsl(168 76% 40%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorSent)"
                        name="Sent"
                      />
                      <Area
                        type="monotone"
                        dataKey="received"
                        stroke="hsl(199 89% 48%)"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorReceived)"
                        name="Received"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex h-[280px] items-center justify-center">
                  <div className="text-center space-y-3">
                    <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <TrendingUp className="h-8 w-8 text-slate-400" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-600 dark:text-slate-300">
                        No message data yet
                      </p>
                      <p className="text-sm text-slate-400 dark:text-slate-500">
                        Start sending messages to see analytics
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/60 dark:border-slate-800/60 opacity-0 animate-fade-in" style={{ animationDelay: '350ms', animationFillMode: 'forwards' }}>
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50">
              <CardTitle className="flex items-center gap-2.5 text-lg">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-500/10">
                  <Zap className="h-4 w-4 text-amber-500" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={cn(
                      'flex items-center gap-4 rounded-xl p-4 group',
                      'border border-transparent',
                      'transition-all duration-200',
                      'hover:bg-slate-50 dark:hover:bg-slate-800/60',
                      'hover:border-slate-200 dark:hover:border-slate-700',
                      'hover:shadow-sm'
                    )}
                  >
                    <div className={cn(
                      'rounded-xl p-2.5 transition-transform duration-200',
                      action.bgColor,
                      'group-hover:scale-110'
                    )}>
                      <Icon className={cn('h-5 w-5', action.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {action.title}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">
                        {action.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
