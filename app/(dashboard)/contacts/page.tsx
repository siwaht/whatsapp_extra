'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search,
  Plus,
  MoreVertical,
  User,
  Tag,
  Download,
  Upload,
  Trash2,
  Edit,
  MessageSquare,
  Filter,
  Users,
} from 'lucide-react';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useUIStore } from '@/lib/stores/ui-store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Contact, ContactTag } from '@/types/database';

interface ContactWithTags extends Contact {
  tags?: ContactTag[];
}

export default function ContactsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { contactSearchQuery, setContactSearchQuery } = useUIStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [newContact, setNewContact] = useState({
    name: '',
    phone_number: '',
    notes: '',
  });

  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user!.id)
        .eq('is_group', false)
        .order('name', { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user?.id,
  });

  const { data: tags } = useQuery({
    queryKey: ['contact-tags', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_tags')
        .select('*')
        .eq('user_id', user!.id);

      if (error) throw error;
      return data as ContactTag[];
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (contact: typeof newContact) => {
      const { data, error } = await supabase
        .from('contacts')
        .insert({
          user_id: user!.id,
          whatsapp_id: contact.phone_number.replace(/\D/g, '') + '@s.whatsapp.net',
          phone_number: contact.phone_number,
          name: contact.name,
          notes: contact.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setShowCreateDialog(false);
      setNewContact({ name: '', phone_number: '', notes: '' });
      toast.success('Contact created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create contact', { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await getSupabase().from('contacts').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setSelectedContacts([]);
      toast.success('Contacts deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete contacts', { description: error.message });
    },
  });

  const filteredContacts = contacts?.filter((contact) => {
    if (!contactSearchQuery) return true;
    const searchLower = contactSearchQuery.toLowerCase();
    return (
      contact.name?.toLowerCase().includes(searchLower) ||
      contact.phone_number?.toLowerCase().includes(searchLower) ||
      contact.push_name?.toLowerCase().includes(searchLower)
    );
  });

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts?.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts?.map((c) => c.id) || []);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col">
      <Header title="Contacts" />

      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Contact Management</h2>
            <p className="text-muted-foreground">
              Manage your WhatsApp contacts and groups
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => setShowCreateDialog(true)}
              className="gradient-primary text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={contactSearchQuery}
              onChange={(e) => setContactSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          {selectedContacts.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate(selectedContacts)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete ({selectedContacts.length})
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24 mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredContacts && filteredContacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedContacts.length === filteredContacts.length &&
                          filteredContacts.length > 0
                        }
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={() => toggleSelect(contact.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={contact.profile_picture_url || ''} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(contact.name || contact.push_name)?.[0]?.toUpperCase() ||
                                '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {contact.name || contact.push_name || 'Unknown'}
                            </p>
                            {contact.notes && (
                              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {contact.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {contact.phone_number || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            Contact
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <MessageSquare className="mr-2 h-4 w-4" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Tag className="mr-2 h-4 w-4" />
                              Add Tag
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate([contact.id])}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="rounded-full bg-primary/10 p-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No contacts yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Add your first contact to get started
                </p>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="mt-6 gradient-primary text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Contact
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription>
              Add a new contact to your WhatsApp address book
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={newContact.name}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1 234 567 8900"
                value={newContact.phone_number}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, phone_number: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this contact..."
                value={newContact.notes}
                onChange={(e) =>
                  setNewContact((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate(newContact)}
              disabled={!newContact.phone_number || createMutation.isPending}
              className="gradient-primary text-white"
            >
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}