'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User,
  Shield,
  Webhook,
  CreditCard,
  Key,
  Save,
  Loader2,
  Eye,
  EyeOff,
  Database,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, session, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabase();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [showPicaKey, setShowPicaKey] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: user?.profile?.full_name || '',
    pica_secret_key: user?.profile?.pica_secret_key || '',
  });
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'security', 'api', 'billing'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name.trim(),
          pica_secret_key: data.pica_secret_key.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      refreshProfile();
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update profile', { description: error.message });
    },
  });


  const updatePasswordMutation = useMutation({
    mutationFn: async (data: typeof passwordData) => {
      if (data.new !== data.confirm) {
        throw new Error('Passwords do not match');
      }
      if (data.new.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }
      const { error } = await getSupabase().auth.updateUser({
        password: data.new,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setPasswordData({ current: '', new: '', confirm: '' });
      toast.success('Password updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update password', { description: error.message });
    },
  });

  return (
    <div className="flex flex-col">
      <Header title="Settings" />

      <div className="flex-1 space-y-6 p-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-xl grid-cols-4">
            <TabsTrigger value="profile" className="gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="gap-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API</span>
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Billing</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user?.profile?.avatar_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {user?.profile?.full_name?.[0]?.toUpperCase() ||
                        user?.email?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">
                      {user?.profile?.full_name || 'User'}
                    </h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className="mt-2" variant="outline">
                      {user?.profile?.role?.name || 'No role'}
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={profileData.full_name}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email || ''} disabled />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => updateProfileMutation.mutate(profileData)}
                    disabled={updateProfileMutation.isPending}
                    className="gradient-primary text-white"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwordData.current}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        current: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwordData.new}
                    onChange={(e) =>
                      setPasswordData((prev) => ({ ...prev, new: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwordData.confirm}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirm: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => updatePasswordMutation.mutate(passwordData)}
                    disabled={
                      !passwordData.new ||
                      !passwordData.confirm ||
                      updatePasswordMutation.isPending
                    }
                    className="gradient-primary text-white"
                  >
                    {updatePasswordMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Active Sessions</CardTitle>
                <CardDescription>
                  Manage your active sessions and sign out from other devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-full bg-emerald-500/10 p-2">
                      <Shield className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-medium">Current Session</p>
                      <p className="text-sm text-muted-foreground">
                        This device - Active now
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600">
                    Active
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Pica OS Configuration
                </CardTitle>
                <CardDescription>
                  Configure your Pica OS secret key for AI integrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pica-secret">Pica Secret Key</Label>
                  <div className="relative">
                    <Input
                      id="pica-secret"
                      type={showPicaKey ? 'text' : 'password'}
                      placeholder="Your Pica secret key"
                      value={profileData.pica_secret_key}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          pica_secret_key: e.target.value,
                        }))
                      }
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0"
                      onClick={() => setShowPicaKey(!showPicaKey)}
                    >
                      {showPicaKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => updateProfileMutation.mutate(profileData)}
                    disabled={updateProfileMutation.isPending}
                    className="gradient-primary text-white"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Webhook Configuration</CardTitle>
                <CardDescription>
                  Configure webhooks to receive real-time updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Webhook className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 font-semibold">Webhook Settings</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Configure webhooks for each instance in the Instances page
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  Manage your subscription and billing information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Free Plan</h3>
                      <p className="text-sm text-muted-foreground">
                        Basic features for getting started
                      </p>
                    </div>
                    <Badge variant="outline">Current Plan</Badge>
                  </div>
                  <Separator className="my-4" />
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Up to 2 WhatsApp instances
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      1,000 messages per month
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Basic analytics
                    </li>
                  </ul>
                  <Button className="mt-6 w-full gradient-primary text-white">
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}