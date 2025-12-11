'use client';

import { useTheme } from 'next-themes';
import { Menu, Moon, Sun, Bell, Search, Command } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useUIStore } from '@/lib/stores/ui-store';
import { MobileSidebar } from './mobile-sidebar';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title?: string;
  description?: string;
}

export function Header({ title, description }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <header className="sticky top-0 z-30 w-full">
      <div className="flex h-16 items-center gap-4 px-4 md:px-6 bg-background/70 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800/60">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 border-r-0">
            <MobileSidebar />
          </SheetContent>
        </Sheet>

        <div className="flex-1 flex items-center gap-6">
          {title && (
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              )}
            </div>
          )}

          <div className="hidden lg:flex flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className={cn(
                  'w-full h-9 pl-9 pr-12 rounded-lg text-sm',
                  'bg-slate-100/80 dark:bg-slate-800/80',
                  'border border-transparent',
                  'placeholder:text-slate-400 dark:placeholder:text-slate-500',
                  'focus:outline-none focus:border-primary/40 focus:bg-white dark:focus:bg-slate-900',
                  'transition-all duration-200'
                )}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] text-slate-400">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">
                  <Command className="h-2.5 w-2.5 inline" />
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono">K</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="h-[18px] w-[18px] text-slate-600 dark:text-slate-400" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary ring-2 ring-background" />
            <span className="sr-only">Notifications</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Sun className="h-[18px] w-[18px] text-slate-600 dark:text-slate-400 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[18px] w-[18px] text-slate-400 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-36 rounded-xl border-slate-200 dark:border-slate-800 shadow-lg"
            >
              <DropdownMenuItem
                onClick={() => setTheme('light')}
                className="rounded-lg cursor-pointer"
              >
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('dark')}
                className="rounded-lg cursor-pointer"
              >
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setTheme('system')}
                className="rounded-lg cursor-pointer"
              >
                <Command className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
