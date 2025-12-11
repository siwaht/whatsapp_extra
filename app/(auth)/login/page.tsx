'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Loader2, Eye, EyeOff, ArrowRight, Shield, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error('Invalid credentials', {
        description: 'Please check your email and password.',
      });
      setIsLoading(false);
      return;
    }

    toast.success('Welcome back!');
    router.push('/dashboard');
  };

  const features = [
    { icon: Shield, text: 'Enterprise-grade security' },
    { icon: Zap, text: 'Lightning-fast performance' },
    { icon: Globe, text: 'Global message delivery' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-600" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl" />
        </div>
        <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1920')] bg-cover bg-center opacity-10" />

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm shadow-lg shadow-black/10">
              <MessageSquare className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">WhatsAppX</span>
          </div>

          <div className="space-y-8 max-w-md">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight">
                Manage WhatsApp at Scale
              </h1>
              <p className="text-lg text-white/80 leading-relaxed">
                Enterprise-grade WhatsApp management platform. Handle multiple instances,
                automate conversations, and broadcast messages with ease.
              </p>
            </div>

            <div className="space-y-3">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 text-white/90"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-medium">{feature.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-xs text-white/70 mt-1">Uptime SLA</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">10M+</div>
              <div className="text-xs text-white/70 mt-1">Messages/Day</div>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold">5K+</div>
              <div className="text-xs text-white/70 mt-1">Customers</div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-[420px] space-y-8">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-12">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
              <MessageSquare className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">WhatsAppX</span>
          </div>

          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Welcome back
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Enter your credentials to access your dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 dark:text-slate-300">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  'h-12 rounded-xl border-slate-200 dark:border-slate-800',
                  'bg-white dark:bg-slate-900',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  'transition-all duration-200'
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={cn(
                    'h-12 rounded-xl border-slate-200 dark:border-slate-800 pr-12',
                    'bg-white dark:bg-slate-900',
                    'focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'transition-all duration-200'
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full btn-primary group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-slate-50 dark:bg-slate-950 px-4 text-slate-400">
                New to WhatsAppX?
              </span>
            </div>
          </div>

          <p className="text-center">
            <Link
              href="/register"
              className={cn(
                'inline-flex items-center gap-2 text-sm font-medium',
                'text-primary hover:text-primary/80 transition-colors'
              )}
            >
              Create an account
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
