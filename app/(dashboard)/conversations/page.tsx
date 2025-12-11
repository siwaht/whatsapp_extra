'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Send,
  Paperclip,
  MoreVertical,
  User,
  RefreshCw,
  MessageSquare,
  Check,
  CheckCheck,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/lib/stores/ui-store';
import { cn } from '@/lib/utils';
import type { Conversation, Message, Contact, InstanceConfig } from '@/types/database';

const supabase = getSupabase();

interface ConversationWithContact extends Conversation {
  contact?: Contact | null;
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}

function ConversationItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: ConversationWithContact;
  isActive: boolean;
  onClick: () => void;
}) {
  const name =
    conversation.contact?.name ||
    conversation.contact?.push_name ||
    conversation.remote_jid.replace('@s.whatsapp.net', '');

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 p-3 text-left transition-all border-l-2',
        isActive
          ? 'bg-slate-800/80 border-l-primary'
          : 'hover:bg-slate-800/40 border-l-transparent'
      )}
    >
      <Avatar className="h-11 w-11 shrink-0">
        <AvatarImage src={conversation.contact?.profile_picture_url || ''} />
        <AvatarFallback className="bg-slate-600 text-white text-sm">
          {name[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm text-white truncate">{name}</span>
          {conversation.last_message_at && (
            <span className="text-xs text-slate-400">
              {formatDate(conversation.last_message_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-slate-400 truncate mt-0.5">
          {conversation.last_message_preview || 'Open chat to see message'}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const statusIcon = {
    pending: <Clock className="h-3.5 w-3.5" />,
    sent: <Check className="h-3.5 w-3.5" />,
    delivered: <CheckCheck className="h-3.5 w-3.5" />,
    read: <CheckCheck className="h-3.5 w-3.5 text-sky-400" />,
    failed: <Clock className="h-3.5 w-3.5 text-red-400" />,
  };

  const time = new Date(message.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={cn('flex mb-2', message.from_me ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[65%] rounded-lg px-3 py-2 relative',
          message.from_me
            ? 'bg-[#005c4b] text-white rounded-tr-none'
            : 'bg-[#202c33] text-white rounded-tl-none'
        )}
      >
        {message.media_url && message.message_type === 'image' && (
          <div className="mb-2 rounded overflow-hidden">
            <img src={message.media_url} alt="Media" className="max-w-full" />
          </div>
        )}
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-slate-300">{time}</span>
          {message.from_me && (
            <span className="text-slate-300">{statusIcon[message.status]}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { activeConversationId, setActiveConversationId, chatSearchQuery, setChatSearchQuery } =
    useUIStore();
  const [messageInput, setMessageInput] = useState('');
  const [selectedInstance, setSelectedInstance] = useState<string>('all');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: instances } = useQuery({
    queryKey: ['instances', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('instance_configs')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as InstanceConfig[];
    },
    enabled: !!user?.id,
  });

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['conversations', user?.id, selectedInstance],
    queryFn: async () => {
      let query = supabase
        .from('conversations')
        .select(
          `
          *,
          contact:contacts(*)
        `
        )
        .eq('user_id', user!.id)
        .order('last_message_at', { ascending: false });

      if (selectedInstance !== 'all') {
        query = query.eq('instance_id', selectedInstance);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ConversationWithContact[];
    },
    enabled: !!user?.id,
  });

  const activeConversation = conversations?.find((c) => c.id === activeConversationId);

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', activeConversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', activeConversationId!)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!activeConversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_id: user!.id,
          conversation_id: activeConversationId!,
          message_id: `msg_${Date.now()}`,
          remote_jid: activeConversation!.remote_jid,
          from_me: true,
          message_type: 'text',
          content,
          status: 'sent',
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('conversations')
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content,
        })
        .eq('id', activeConversationId!);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', activeConversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageInput('');
    },
  });

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const filteredConversations = conversations?.filter((conv) => {
    if (!chatSearchQuery) return true;
    const name = conv.contact?.name || conv.contact?.push_name || conv.remote_jid;
    return name.toLowerCase().includes(chatSearchQuery.toLowerCase());
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConversationId) return;
    sendMessageMutation.mutate(messageInput.trim());
  };

  const activeInstance = instances?.find((i) => i.id === selectedInstance);
  const contactName =
    activeConversation?.contact?.name ||
    activeConversation?.contact?.push_name ||
    activeConversation?.remote_jid.replace('@s.whatsapp.net', '');

  return (
    <div className="flex h-screen bg-[#111b21]">
      <div className="w-[320px] flex flex-col border-r border-slate-700/50">
        <div className="p-4 flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-white">CrunchChat</h1>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>New Chat</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="px-3 py-2">
          <Select value={selectedInstance} onValueChange={setSelectedInstance}>
            <SelectTrigger className="bg-transparent border-slate-700 text-white h-9">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <SelectValue placeholder="Select instance" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Instances</SelectItem>
              {instances?.map((instance) => (
                <SelectItem key={instance.id} value={instance.id}>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'h-2 w-2 rounded-full',
                        instance.status === 'open' ? 'bg-emerald-500' : 'bg-slate-500'
                      )}
                    />
                    {instance.instance_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search contacts..."
              value={chatSearchQuery}
              onChange={(e) => setChatSearchQuery(e.target.value)}
              className="pl-9 bg-[#202c33] border-0 text-white placeholder:text-slate-500 h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {conversationsLoading ? (
            <div className="space-y-1">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-11 w-11 rounded-full bg-slate-700" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 bg-slate-700" />
                    <Skeleton className="h-3 w-32 mt-2 bg-slate-700" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations && filteredConversations.length > 0 ? (
            filteredConversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => setActiveConversationId(conv.id)}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-12 w-12 text-slate-600" />
              <p className="mt-4 text-slate-400 text-sm">No conversations yet</p>
            </div>
          )}
        </ScrollArea>
      </div>

      {activeConversationId && activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-2 bg-[#202c33] border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={activeConversation.contact?.profile_picture_url || ''} />
                <AvatarFallback className="bg-slate-600 text-white">
                  {contactName?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-medium text-white">{contactName}</h3>
                <p className="text-xs text-slate-400">
                  Last seen{' '}
                  {activeConversation.last_message_at
                    ? formatDate(activeConversation.last_message_at)
                    : 'recently'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <User className="h-5 w-5" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-white hover:bg-slate-700"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>View Profile</DropdownMenuItem>
                  <DropdownMenuItem>Archive Chat</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-400">Delete Chat</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div
            className="flex-1 overflow-y-auto p-4"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundColor: '#0b141a',
            }}
            ref={scrollAreaRef}
          >
            {messagesLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={cn('flex', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                    <Skeleton
                      className={cn(
                        'h-12 w-48 rounded-lg',
                        i % 2 === 0 ? 'bg-[#005c4b]/50' : 'bg-[#202c33]'
                      )}
                    />
                  </div>
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              <>
                {messages.map((msg) => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={messagesEndRef} />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-slate-500 text-sm">No messages yet</p>
                <p className="text-slate-600 text-xs mt-1">
                  Send a message to start the conversation
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="p-3 bg-[#202c33]">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white hover:bg-slate-700 shrink-0"
              >
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                className="flex-1 bg-[#2a3942] border-0 text-white placeholder:text-slate-500 rounded-lg"
              />
              <Button
                type="submit"
                size="icon"
                className="bg-primary hover:bg-primary/90 text-white shrink-0 rounded-full"
                disabled={!messageInput.trim() || sendMessageMutation.isPending}
              >
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-[#222e35]">
          <div className="text-center">
            <div className="mx-auto w-[280px] h-[280px] rounded-full bg-[#364147] flex items-center justify-center mb-8">
              <MessageSquare className="h-32 w-32 text-slate-500" />
            </div>
            <h3 className="text-3xl font-light text-slate-300">CrunchChat for Web</h3>
            <p className="mt-4 text-slate-500 max-w-md">
              Send and receive messages without keeping your phone online.
              <br />
              Select a conversation to start chatting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
