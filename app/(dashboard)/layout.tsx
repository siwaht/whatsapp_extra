'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const { sidebarCollapsed } = useUIStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-xl gradient-primary animate-pulse" />
            <Loader2 className="absolute inset-0 m-auto h-6 w-6 animate-spin text-white" />
          </div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.08),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(20,184,166,0.12),rgba(255,255,255,0))] pointer-events-none" />
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <main
        className={cn(
          'relative min-h-screen transition-all duration-300 ease-out',
          'md:ml-[260px]',
          sidebarCollapsed && 'md:ml-[72px]'
        )}
      >
        {children}
      </main>
    </div>
  );
}
