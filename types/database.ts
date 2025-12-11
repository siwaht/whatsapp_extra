export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      permissions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          resource: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          resource: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          resource?: string;
          created_at?: string;
        };
      };
      role_permissions: {
        Row: {
          role_id: string;
          permission_id: string;
        };
        Insert: {
          role_id: string;
          permission_id: string;
        };
        Update: {
          role_id?: string;
          permission_id?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role_id: string | null;
          pica_secret_key: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          role_id?: string | null;
          pica_secret_key?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role_id?: string | null;
          pica_secret_key?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_sessions: {
        Row: {
          id: string;
          user_id: string;
          ip_address: string | null;
          user_agent: string | null;
          is_valid: boolean;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_valid?: boolean;
          created_at?: string;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          is_valid?: boolean;
          created_at?: string;
          expires_at?: string;
        };
      };
      instance_configs: {
        Row: {
          id: string;
          user_id: string;
          instance_name: string;
          instance_id: string | null;
          status: 'open' | 'connecting' | 'closed' | 'error';
          phone_number: string | null;
          phone_label: string | null;
          webhook_url: string | null;
          webhook_events: Json;
          proxy_settings: Json;
          settings: Json;
          evolution_api_url: string | null;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_name: string;
          instance_id?: string | null;
          status?: 'open' | 'connecting' | 'closed' | 'error';
          phone_number?: string | null;
          phone_label?: string | null;
          webhook_url?: string | null;
          webhook_events?: Json;
          proxy_settings?: Json;
          settings?: Json;
          evolution_api_url?: string | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_name?: string;
          instance_id?: string | null;
          status?: 'open' | 'connecting' | 'closed' | 'error';
          phone_number?: string | null;
          phone_label?: string | null;
          webhook_url?: string | null;
          webhook_events?: Json;
          proxy_settings?: Json;
          settings?: Json;
          evolution_api_url?: string | null;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      contact_tags: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          created_at?: string;
        };
      };
      contacts: {
        Row: {
          id: string;
          user_id: string;
          instance_id: string | null;
          whatsapp_id: string;
          phone_number: string | null;
          name: string | null;
          push_name: string | null;
          profile_picture_url: string | null;
          notes: string | null;
          custom_fields: Json;
          is_group: boolean;
          group_metadata: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_id?: string | null;
          whatsapp_id: string;
          phone_number?: string | null;
          name?: string | null;
          push_name?: string | null;
          profile_picture_url?: string | null;
          notes?: string | null;
          custom_fields?: Json;
          is_group?: boolean;
          group_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_id?: string | null;
          whatsapp_id?: string;
          phone_number?: string | null;
          name?: string | null;
          push_name?: string | null;
          profile_picture_url?: string | null;
          notes?: string | null;
          custom_fields?: Json;
          is_group?: boolean;
          group_metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          user_id: string;
          instance_id: string | null;
          contact_id: string | null;
          remote_jid: string;
          is_group: boolean;
          unread_count: number;
          last_message_at: string | null;
          last_message_preview: string | null;
          is_archived: boolean;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_id?: string | null;
          contact_id?: string | null;
          remote_jid: string;
          is_group?: boolean;
          unread_count?: number;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          is_archived?: boolean;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_id?: string | null;
          contact_id?: string | null;
          remote_jid?: string;
          is_group?: boolean;
          unread_count?: number;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          is_archived?: boolean;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          instance_id: string | null;
          message_id: string;
          remote_jid: string;
          from_me: boolean;
          message_type: string;
          content: string | null;
          media_url: string | null;
          media_mime_type: string | null;
          media_caption: string | null;
          quoted_message_id: string | null;
          status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
          raw_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id: string;
          instance_id?: string | null;
          message_id: string;
          remote_jid: string;
          from_me?: boolean;
          message_type?: string;
          content?: string | null;
          media_url?: string | null;
          media_mime_type?: string | null;
          media_caption?: string | null;
          quoted_message_id?: string | null;
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
          raw_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string;
          instance_id?: string | null;
          message_id?: string;
          remote_jid?: string;
          from_me?: boolean;
          message_type?: string;
          content?: string | null;
          media_url?: string | null;
          media_mime_type?: string | null;
          media_caption?: string | null;
          quoted_message_id?: string | null;
          status?: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
          raw_data?: Json | null;
          created_at?: string;
        };
      };
      broadcasts: {
        Row: {
          id: string;
          user_id: string;
          instance_id: string;
          name: string;
          status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
          message_type: string;
          message_content: string | null;
          media_url: string | null;
          media_caption: string | null;
          recipient_type: 'contacts' | 'tags' | 'groups' | 'custom';
          recipient_filter: Json;
          total_recipients: number;
          sent_count: number;
          delivered_count: number;
          failed_count: number;
          scheduled_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_id: string;
          name: string;
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
          message_type?: string;
          message_content?: string | null;
          media_url?: string | null;
          media_caption?: string | null;
          recipient_type?: 'contacts' | 'tags' | 'groups' | 'custom';
          recipient_filter?: Json;
          total_recipients?: number;
          sent_count?: number;
          delivered_count?: number;
          failed_count?: number;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_id?: string;
          name?: string;
          status?: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
          message_type?: string;
          message_content?: string | null;
          media_url?: string | null;
          media_caption?: string | null;
          recipient_type?: 'contacts' | 'tags' | 'groups' | 'custom';
          recipient_filter?: Json;
          total_recipients?: number;
          sent_count?: number;
          delivered_count?: number;
          failed_count?: number;
          scheduled_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_agents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          system_prompt: string | null;
          model: string;
          temperature: number;
          max_tokens: number;
          top_p: number;
          frequency_penalty: number;
          presence_penalty: number;
          parent_agent_id: string | null;
          is_active: boolean;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          system_prompt?: string | null;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          frequency_penalty?: number;
          presence_penalty?: number;
          parent_agent_id?: string | null;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          system_prompt?: string | null;
          model?: string;
          temperature?: number;
          max_tokens?: number;
          top_p?: number;
          frequency_penalty?: number;
          presence_penalty?: number;
          parent_agent_id?: string | null;
          is_active?: boolean;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_tools: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          tool_type: string;
          endpoint_url: string | null;
          auth_config: Json;
          parameters_schema: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          tool_type?: string;
          endpoint_url?: string | null;
          auth_config?: Json;
          parameters_schema?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          tool_type?: string;
          endpoint_url?: string | null;
          auth_config?: Json;
          parameters_schema?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      webhook_events: {
        Row: {
          id: string;
          user_id: string | null;
          instance_id: string | null;
          event_type: string;
          payload: Json;
          processed: boolean;
          processed_at: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          instance_id?: string | null;
          event_type: string;
          payload: Json;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          instance_id?: string | null;
          event_type?: string;
          payload?: Json;
          processed?: boolean;
          processed_at?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
      message_stats: {
        Row: {
          id: string;
          user_id: string;
          instance_id: string | null;
          stat_date: string;
          messages_sent: number;
          messages_received: number;
          messages_delivered: number;
          messages_read: number;
          messages_failed: number;
          unique_contacts: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          instance_id?: string | null;
          stat_date: string;
          messages_sent?: number;
          messages_received?: number;
          messages_delivered?: number;
          messages_read?: number;
          messages_failed?: number;
          unique_contacts?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          instance_id?: string | null;
          stat_date?: string;
          messages_sent?: number;
          messages_received?: number;
          messages_delivered?: number;
          messages_read?: number;
          messages_failed?: number;
          unique_contacts?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan_id: string | null;
          plan_name: string | null;
          status: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_id?: string | null;
          plan_name?: string | null;
          status?: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan_id?: string | null;
          plan_name?: string | null;
          status?: 'inactive' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      knowledge_collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          weaviate_class: string;
          document_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          weaviate_class?: string;
          document_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          weaviate_class?: string;
          document_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      knowledge_documents: {
        Row: {
          id: string;
          user_id: string;
          collection_id: string | null;
          weaviate_id: string | null;
          weaviate_class: string;
          title: string;
          content: string | null;
          content_preview: string | null;
          source_type: 'text' | 'url' | 'file';
          source_url: string | null;
          file_type: string | null;
          chunk_count: number;
          processing_status: 'pending' | 'processing' | 'completed' | 'failed';
          error_message: string | null;
          metadata: Json;
          has_vector: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          collection_id?: string | null;
          weaviate_id?: string | null;
          weaviate_class?: string;
          title: string;
          content?: string | null;
          content_preview?: string | null;
          source_type?: 'text' | 'url' | 'file';
          source_url?: string | null;
          file_type?: string | null;
          chunk_count?: number;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          metadata?: Json;
          has_vector?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          collection_id?: string | null;
          weaviate_id?: string | null;
          weaviate_class?: string;
          title?: string;
          content?: string | null;
          content_preview?: string | null;
          source_type?: 'text' | 'url' | 'file';
          source_url?: string | null;
          file_type?: string | null;
          chunk_count?: number;
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
          error_message?: string | null;
          metadata?: Json;
          has_vector?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      agent_knowledge_links: {
        Row: {
          agent_id: string;
          collection_id: string;
          created_at: string;
        };
        Insert: {
          agent_id: string;
          collection_id: string;
          created_at?: string;
        };
        Update: {
          agent_id?: string;
          collection_id?: string;
          created_at?: string;
        };
      };
      knowledge_chunks: {
        Row: {
          id: string;
          document_id: string;
          user_id: string;
          chunk_index: number;
          content: string;
          weaviate_id: string | null;
          token_count: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          user_id: string;
          chunk_index?: number;
          content: string;
          weaviate_id?: string | null;
          token_count?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          user_id?: string;
          chunk_index?: number;
          content?: string;
          weaviate_id?: string | null;
          token_count?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Role = Tables<'roles'>;
export type Permission = Tables<'permissions'>;
export type InstanceConfig = Tables<'instance_configs'>;
export type Contact = Tables<'contacts'>;
export type ContactTag = Tables<'contact_tags'>;
export type Conversation = Tables<'conversations'>;
export type Message = Tables<'messages'>;
export type Broadcast = Tables<'broadcasts'>;
export type AIAgent = Tables<'ai_agents'>;
export type AITool = Tables<'ai_tools'>;
export type WebhookEvent = Tables<'webhook_events'>;
export type AuditLog = Tables<'audit_logs'>;
export type MessageStat = Tables<'message_stats'>;
export type Subscription = Tables<'subscriptions'>;
export type KnowledgeCollection = Tables<'knowledge_collections'>;
export type KnowledgeDocument = Tables<'knowledge_documents'>;
export type KnowledgeChunk = Tables<'knowledge_chunks'>;
export type AgentKnowledgeLink = Tables<'agent_knowledge_links'>;

export interface WebhookConfig {
  id: string;
  user_id: string;
  instance_id: string;
  name: string;
  url: string;
  events: string[];
  headers: Record<string, string>;
  is_active: boolean;
  retry_count: number;
  timeout_ms: number;
  created_at: string;
  updated_at: string;
}