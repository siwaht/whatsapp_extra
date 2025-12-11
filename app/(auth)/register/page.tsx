'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, Loader2, Eye, EyeOff, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      toast.error('Registration failed', {
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    toast.success('Account created successfully!', {
      description: 'You can now sign in with your credentials.',
    });
    router.push('/login');
  };

  const passwordRequirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

      <div className="w-full flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-[480px] space-y-8">
          <div className="flex items-center justify-between">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
                <MessageSquare className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold gradient-text">WhatsAppX</span>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Create your account
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Get started with WhatsAppX today. No credit card required.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-slate-700 dark:text-slate-300">
                Full name
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
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
              <Label htmlFor="password" className="text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
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
              {password && (
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className={cn(
                        'flex items-center gap-1.5 text-xs transition-colors',
                        req.met ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                      )}
                    >
                      <div className={cn(
                        'h-3.5 w-3.5 rounded-full flex items-center justify-center transition-colors',
                        req.met ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                      )}>
                        {req.met && <Check className="h-2 w-2 text-white" />}
                      </div>
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-700 dark:text-slate-300">
                Confirm password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={cn(
                  'h-12 rounded-xl border-slate-200 dark:border-slate-800',
                  'bg-white dark:bg-slate-900',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  'transition-all duration-200',
                  confirmPassword && password !== confirmPassword && 'border-red-300 dark:border-red-800'
                )}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full btn-primary group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline font-medium">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline font-medium">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
