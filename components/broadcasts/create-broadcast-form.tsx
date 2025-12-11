'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare,
  Users,
  Settings,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  Link2,
  ImageIcon,
  Video,
  Type,
  Check,
  Plus,
  X,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { PhonePreview } from './phone-preview';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Contact, InstanceConfig } from '@/types/database';

interface CreateBroadcastFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

type TabType = 'message' | 'recipients' | 'settings';
type MessageType = 'text' | 'image' | 'video';

const MAX_MESSAGE_LENGTH = 1000;

export function CreateBroadcastForm({ onClose, onSuccess }: CreateBroadcastFormProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const supabase = getSupabase();

  const [activeTab, setActiveTab] = useState<TabType>('message');
  const [formData, setFormData] = useState({
    title: '',
    messageType: 'text' as MessageType,
    mediaUrl: '',
    messageContent: '',
    enableUrlTracking: false,
    instanceId: '',
    recipientType: 'all' as 'all' | 'selected' | 'tags',
    selectedContacts: [] as string[],
    selectedTags: [] as string[],
    scheduledAt: '',
    delayBetweenMessages: 3,
  });
  const [contactSearch, setContactSearch] = useState('');

  const { data: instances } = useQuery({
    queryKey: ['instances', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instance_configs')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'open');

      if (error) throw error;
      return data as InstanceConfig[];
    },
    enabled: !!user?.id,
  });

  const { data: contacts, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user!.id)
        .order('name');

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user?.id,
  });

  const filteredContacts = contacts?.filter(
    (c) =>
      c.name?.toLowerCase().includes(contactSearch.toLowerCase()) ||
      c.phone_number?.includes(contactSearch)
  );

  const allTags = [...new Set(contacts?.flatMap((c) => {
    const tags = (c.custom_fields as { tags?: string[] })?.tags || [];
    return tags;
  }) || [])];

  const createMutation = useMutation({
    mutationFn: async () => {
      let recipientIds: string[] = [];

      if (formData.recipientType === 'all') {
        recipientIds = contacts?.map((c) => c.id) || [];
      } else if (formData.recipientType === 'selected') {
        recipientIds = formData.selectedContacts;
      } else if (formData.recipientType === 'tags') {
        recipientIds =
          contacts
            ?.filter((c) => {
              const tags = (c.custom_fields as { tags?: string[] })?.tags || [];
              return tags.some((t) => formData.selectedTags.includes(t));
            })
            .map((c) => c.id) || [];
      }

      const { data, error } = await supabase
        .from('broadcasts')
        .insert({
          user_id: user!.id,
          name: formData.title,
          message_type: formData.messageType,
          media_url: formData.mediaUrl || null,
          message_content: formData.messageContent,
          instance_id: formData.instanceId,
          recipient_type: formData.recipientType === 'all' ? 'contacts' : formData.recipientType === 'tags' ? 'tags' : 'custom',
          recipient_filter: { recipient_ids: recipientIds },
          total_recipients: recipientIds.length,
          status: 'draft',
          scheduled_at: formData.scheduledAt || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcasts'] });
      toast.success('Broadcast created successfully');
      onSuccess();
    },
    onError: (error) => {
      toast.error('Failed to create broadcast', { description: error.message });
    },
  });

  const tabs = [
    { id: 'message', label: 'Message', icon: MessageSquare },
    { id: 'recipients', label: 'Recipients', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const;

  const canProceedToRecipients = formData.title && formData.messageContent;
  const canProceedToSettings = formData.instanceId && getRecipientCount() > 0;
  const canCreate = canProceedToRecipients && canProceedToSettings;

  function getRecipientCount() {
    if (formData.recipientType === 'all') return contacts?.length || 0;
    if (formData.recipientType === 'selected') return formData.selectedContacts.length;
    if (formData.recipientType === 'tags') {
      return (
        contacts?.filter((c) => {
          const tags = (c.custom_fields as { tags?: string[] })?.tags || [];
          return tags.some((t) => formData.selectedTags.includes(t));
        }).length || 0
      );
    }
    return 0;
  }

  const handleNext = () => {
    if (activeTab === 'message') setActiveTab('recipients');
    else if (activeTab === 'recipients') setActiveTab('settings');
  };

  const handlePrevious = () => {
    if (activeTab === 'recipients') setActiveTab('message');
    else if (activeTab === 'settings') setActiveTab('recipients');
  };

  const toggleContact = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedContacts: prev.selectedContacts.includes(id)
        ? prev.selectedContacts.filter((c) => c !== id)
        : [...prev.selectedContacts, id],
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Broadcasts
          </Button>
        </div>
        <Button
          onClick={() => createMutation.mutate()}
          disabled={!canCreate || createMutation.isPending}
          className="gradient-primary text-white gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Create Broadcast
        </Button>
      </div>

      <div className="px-6 py-4 border-b">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Create Broadcast</h1>
          <Badge variant="secondary">Draft</Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Create a new broadcast message to send to multiple contacts
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="border-b">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors relative',
                    activeTab === tab.id
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              {activeTab === 'message' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="h-4 w-4" />
                    Message Content
                  </div>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Create the content for your broadcast message
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="title">Broadcast Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter a descriptive title for your broadcast"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      This title is for your reference only and won't be visible to recipients
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Message Header</Label>
                      <span className="text-xs text-muted-foreground">Optional</span>
                    </div>
                    <RadioGroup
                      value={formData.messageType}
                      onValueChange={(value: MessageType) =>
                        setFormData((prev) => ({ ...prev, messageType: value }))
                      }
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="text" id="text" />
                        <Label htmlFor="text" className="flex items-center gap-1 cursor-pointer">
                          <Type className="h-4 w-4" />
                          Text Only
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="image" id="image" />
                        <Label htmlFor="image" className="flex items-center gap-1 cursor-pointer">
                          <ImageIcon className="h-4 w-4" />
                          With Image
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="video" id="video" />
                        <Label htmlFor="video" className="flex items-center gap-1 cursor-pointer">
                          <Video className="h-4 w-4" />
                          With Video
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {(formData.messageType === 'image' || formData.messageType === 'video') && (
                    <div className="space-y-2">
                      <Label htmlFor="mediaUrl">
                        {formData.messageType === 'image' ? 'Image URL' : 'Video URL'}
                      </Label>
                      <Input
                        id="mediaUrl"
                        placeholder={`Enter ${formData.messageType} URL...`}
                        value={formData.mediaUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, mediaUrl: e.target.value }))
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message">Message Content</Label>
                      <span className="text-xs text-muted-foreground">
                        {formData.messageContent.length}/{MAX_MESSAGE_LENGTH} characters
                      </span>
                    </div>
                    <Textarea
                      id="message"
                      placeholder="Type your message content here..."
                      rows={6}
                      maxLength={MAX_MESSAGE_LENGTH}
                      value={formData.messageContent}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, messageContent: e.target.value }))
                      }
                    />
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>You can use the following variables in your message:</p>
                      <ul className="list-disc list-inside space-y-0.5 pl-2">
                        <li>
                          <code className="bg-muted px-1 py-0.5 rounded text-primary">
                            {'{{name}}'}
                          </code>{' '}
                          - Recipient's name
                        </li>
                        <li>
                          <code className="bg-muted px-1 py-0.5 rounded text-primary">
                            {'{{phone}}'}
                          </code>{' '}
                          - Recipient's phone number
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        <Label htmlFor="url-tracking" className="font-medium">
                          Enable URL Tracking
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Track clicks on links in your message
                      </p>
                    </div>
                    <Switch
                      id="url-tracking"
                      checked={formData.enableUrlTracking}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, enableUrlTracking: checked }))
                      }
                    />
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button
                      onClick={handleNext}
                      disabled={!canProceedToRecipients}
                      className="gap-2"
                    >
                      Next: Recipients
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'recipients' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Users className="h-4 w-4" />
                    Select Recipients
                  </div>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Choose who will receive this broadcast
                  </p>

                  <div className="space-y-2">
                    <Label>WhatsApp Instance</Label>
                    <Select
                      value={formData.instanceId}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, instanceId: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an instance to send from" />
                      </SelectTrigger>
                      <SelectContent>
                        {instances?.map((instance) => (
                          <SelectItem key={instance.id} value={instance.id}>
                            {instance.instance_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <Label>Recipient Selection</Label>
                    <RadioGroup
                      value={formData.recipientType}
                      onValueChange={(value: 'all' | 'selected' | 'tags') =>
                        setFormData((prev) => ({ ...prev, recipientType: value }))
                      }
                      className="space-y-3"
                    >
                      <div className="flex items-center space-x-3 rounded-lg border p-4">
                        <RadioGroupItem value="all" id="all" />
                        <Label htmlFor="all" className="flex-1 cursor-pointer">
                          <div className="font-medium">All Contacts</div>
                          <p className="text-xs text-muted-foreground">
                            Send to all {contacts?.length || 0} contacts
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 rounded-lg border p-4">
                        <RadioGroupItem value="selected" id="selected" />
                        <Label htmlFor="selected" className="flex-1 cursor-pointer">
                          <div className="font-medium">Select Contacts</div>
                          <p className="text-xs text-muted-foreground">
                            Choose specific contacts
                          </p>
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 rounded-lg border p-4">
                        <RadioGroupItem value="tags" id="tags" />
                        <Label htmlFor="tags" className="flex-1 cursor-pointer">
                          <div className="font-medium">By Tags</div>
                          <p className="text-xs text-muted-foreground">
                            Select contacts by tags
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.recipientType === 'selected' && (
                    <Card>
                      <CardContent className="p-4 space-y-4">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search contacts..."
                            value={contactSearch}
                            onChange={(e) => setContactSearch(e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        {formData.selectedContacts.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {formData.selectedContacts.map((id) => {
                              const contact = contacts?.find((c) => c.id === id);
                              return (
                                <Badge key={id} variant="secondary" className="gap-1">
                                  {contact?.name || 'Unknown'}
                                  <X
                                    className="h-3 w-3 cursor-pointer"
                                    onClick={() => toggleContact(id)}
                                  />
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        <ScrollArea className="h-[200px]">
                          {contactsLoading ? (
                            <div className="space-y-2">
                              {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              {filteredContacts?.map((contact) => (
                                <div
                                  key={contact.id}
                                  className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                                  onClick={() => toggleContact(contact.id)}
                                >
                                  <Checkbox
                                    checked={formData.selectedContacts.includes(contact.id)}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{contact.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {contact.phone_number}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  )}

                  {formData.recipientType === 'tags' && (
                    <Card>
                      <CardContent className="p-4">
                        {allTags.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {allTags.map((tag) => (
                              <Badge
                                key={tag}
                                variant={
                                  formData.selectedTags.includes(tag) ? 'default' : 'outline'
                                }
                                className="cursor-pointer"
                                onClick={() => toggleTag(tag)}
                              >
                                {formData.selectedTags.includes(tag) && (
                                  <Check className="h-3 w-3 mr-1" />
                                )}
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No tags found. Add tags to your contacts first.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="bg-muted/50">
                    <CardContent className="p-4 flex items-center justify-between">
                      <span className="text-sm">Selected Recipients</span>
                      <span className="font-bold text-lg">{getRecipientCount()}</span>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevious} className="gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      onClick={handleNext}
                      disabled={!canProceedToSettings}
                      className="gap-2"
                    >
                      Next: Settings
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-6 max-w-2xl">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Settings className="h-4 w-4" />
                    Broadcast Settings
                  </div>
                  <p className="text-sm text-muted-foreground -mt-4">
                    Configure delivery settings for your broadcast
                  </p>

                  <div className="space-y-2">
                    <Label htmlFor="schedule">Schedule (Optional)</Label>
                    <Input
                      id="schedule"
                      type="datetime-local"
                      value={formData.scheduledAt}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Leave empty to save as draft for manual start
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="delay">Delay Between Messages (seconds)</Label>
                    <Input
                      id="delay"
                      type="number"
                      min={1}
                      max={60}
                      value={formData.delayBetweenMessages}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          delayBetweenMessages: parseInt(e.target.value) || 3,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Add delay between messages to avoid rate limiting (recommended: 3-5 seconds)
                    </p>
                  </div>

                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-2">Broadcast Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Title</span>
                          <span className="font-medium">{formData.title}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recipients</span>
                          <span className="font-medium">{getRecipientCount()} contacts</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Instance</span>
                          <span className="font-medium">
                            {instances?.find((i) => i.id === formData.instanceId)?.instance_name ||
                              '-'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Schedule</span>
                          <span className="font-medium">
                            {formData.scheduledAt
                              ? new Date(formData.scheduledAt).toLocaleString()
                              : 'Manual start'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between pt-4">
                    <Button variant="outline" onClick={handlePrevious} className="gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      onClick={() => createMutation.mutate()}
                      disabled={!canCreate || createMutation.isPending}
                      className="gradient-primary text-white gap-2"
                    >
                      <Check className="h-4 w-4" />
                      {createMutation.isPending ? 'Creating...' : 'Create Broadcast'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <div className="w-[340px] border-l bg-muted/30 p-6 hidden lg:block">
          <PhonePreview
            message={formData.messageContent}
            mediaType={formData.messageType}
            mediaUrl={formData.mediaUrl}
          />
        </div>
      </div>
    </div>
  );
}
