'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Users,
  Radio,
  Bot,
  Settings,
  LogOut,
  ChevronsLeft,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useUIStore } from '@/lib/stores/ui-store';
import { useAuth } from '@/lib/auth-context';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    permission: null,
  },
  {
    name: 'Instances',
    href: '/instances',
    icon: Smartphone,
    permission: 'instance.read',
  },
  {
    name: 'Conversations',
    href: '/conversations',
    icon: MessageSquare,
    permission: 'chat.read',
  },
  {
    name: 'Contacts',
    href: '/contacts',
    icon: Users,
    permission: 'contact.read',
  },
  {
    name: 'Broadcasts',
    href: '/broadcasts',
    icon: Radio,
    permission: 'broadcast.read',
  },
  {
    name: 'Knowledge Base',
    href: '/knowledge',
    icon: BookOpen,
    permission: 'knowledge.read',
  },
  {
    name: 'AI Agents',
    href: '/ai-agents',
    icon: Bot,
    permission: 'agent.read',
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: Settings,
    permission: 'settings.read',
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebarCollapsed } = useUIStore();
  const { user, signOut, hasPermission } = useAuth();

  const filteredNav = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-out',
          'bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900',
          'border-r border-slate-200/80 dark:border-slate-800/80',
          sidebarCollapsed ? 'w-[72px]' : 'w-[260px]'
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="relative flex h-full flex-col">
          <div className={cn(
            'flex h-16 items-center border-b border-slate-200/80 dark:border-slate-800/60',
            sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
          )}>
            <Link
              href="/dashboard"
              prefetch={true}
              className={cn(
                'flex items-center gap-3 group cursor-pointer',
                sidebarCollapsed && 'justify-center'
              )}
            >
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25 transition-transform duration-300 group-hover:scale-105">
                <MessageSquare className="h-[18px] w-[18px] text-white" />
                <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold gradient-text">WhatsAppX</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                </div>
              )}
            </Link>
            {!sidebarCollapsed && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebarCollapsed();
                }}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            )}
          </div>

          {sidebarCollapsed && (
            <div className="flex justify-center py-3 border-b border-slate-200/60 dark:border-slate-800/40">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSidebarCollapsed();
                }}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground rotate-180 transition-colors cursor-pointer"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
            </div>
          )}

          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {filteredNav.map((item, index) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium',
                      'transition-colors duration-150 group cursor-pointer',
                      isActive
                        ? 'bg-primary/10 text-primary shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200',
                      sidebarCollapsed && 'justify-center px-2'
                    )}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-full bg-gradient-to-b from-primary to-primary/60" />
                    )}
                    <div className={cn(
                      'flex items-center justify-center rounded-lg p-1.5 transition-colors duration-150',
                      isActive
                        ? 'bg-primary/10'
                        : 'group-hover:bg-slate-200/60 dark:group-hover:bg-slate-700/40'
                    )}>
                      <Icon className={cn(
                        'h-[18px] w-[18px] shrink-0',
                        isActive && 'text-primary'
                      )} />
                    </div>
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.name}</span>
                    )}
                    {isActive && !sidebarCollapsed && (
                      <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    )}
                  </Link>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.href} delayDuration={300}>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-0"
                      >
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return linkContent;
              })}
            </nav>
          </ScrollArea>

          <div className="border-t border-slate-200/80 dark:border-slate-800/60 p-3">
            {user && (
              <div
                className={cn(
                  'flex items-center gap-3 rounded-xl p-2 transition-colors',
                  'hover:bg-slate-100 dark:hover:bg-slate-800/60',
                  sidebarCollapsed && 'justify-center'
                )}
              >
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 text-sm font-semibold text-primary ring-2 ring-primary/10">
                  {user.profile?.full_name?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase()}
                  <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                {!sidebarCollapsed && (
                  <>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {user.profile?.full_name || 'User'}
                      </p>
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.profile?.role?.name || 'No role'}
                      </p>
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            signOut();
                          }}
                          className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">Sign out</TooltipContent>
                    </Tooltip>
                  </>
                )}
                {sidebarCollapsed && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          signOut();
                        }}
                        className="absolute -right-1 -bottom-1 h-6 w-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 shadow-sm cursor-pointer"
                      >
                        <LogOut className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="right">Sign out</TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
