export interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
  authMethod?: 'apikey' | 'bearer';
}

export interface EvolutionInstance {
  instanceName: string;
  instanceId?: string;
  status: string;
  serverUrl?: string;
  apikey?: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  integration?: string;
}

export interface EvolutionQRCode {
  code: string;
  base64: string;
  pairingCode?: string;
}

export interface EvolutionConnectionState {
  instance: string;
  state: 'open' | 'connecting' | 'close';
}

export interface EvolutionChat {
  id: string;
  remoteJid: string;
  pushName?: string;
  profilePicUrl?: string;
  isGroup?: boolean;
  lastMessageTimestamp?: number;
  unreadCount?: number;
}

export interface EvolutionMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  messageTimestamp?: number;
  pushName?: string;
  message?: {
    conversation?: string;
    imageMessage?: {
      url?: string;
      mimetype?: string;
      caption?: string;
    };
    videoMessage?: {
      url?: string;
      mimetype?: string;
      caption?: string;
    };
    audioMessage?: {
      url?: string;
      mimetype?: string;
    };
    documentMessage?: {
      url?: string;
      mimetype?: string;
      fileName?: string;
    };
    extendedTextMessage?: {
      text?: string;
    };
  };
  messageType?: string;
  status?: 'PENDING' | 'SENT' | 'DELIVERY_ACK' | 'READ' | 'PLAYED';
}

export interface SendTextPayload {
  number: string;
  text: string;
  delay?: number;
}

export interface SendMediaPayload {
  number: string;
  mediatype: 'image' | 'video' | 'audio' | 'document';
  mimetype?: string;
  caption?: string;
  media: string;
  fileName?: string;
}

export interface WebhookConfig {
  url: string;
  webhookByEvents?: boolean;
  webhookBase64?: boolean;
  events?: string[];
}

export interface EvolutionContact {
  id: string;
  pushName?: string;
  profilePictureUrl?: string;
  isGroup?: boolean;
}

export interface EvolutionGroup {
  id: string;
  subject: string;
  subjectOwner?: string;
  subjectTime?: number;
  size?: number;
  creation?: number;
  owner?: string;
  desc?: string;
  descId?: string;
  participants?: Array<{
    id: string;
    admin?: string;
  }>;
}

class EvolutionAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'EvolutionAPIError';
  }
}

export class EvolutionAPI {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;
  private authMethod: 'apikey' | 'bearer';

  constructor(config: EvolutionConfig) {
    this.baseUrl = config.baseUrl.trim().replace(/\/+$/, '');
    this.apiKey = config.apiKey.trim();
    this.timeout = config.timeout || 30000;
    this.authMethod = config.authMethod || 'apikey';
  }

  private getAuthHeaders(method?: 'apikey' | 'bearer'): Record<string, string> {
    const authMethod = method || this.authMethod;
    if (authMethod === 'bearer') {
      return { Authorization: `Bearer ${this.apiKey}` };
    }
    return { apikey: this.apiKey };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryWithAltAuth = true
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message ||
          errorData.error ||
          errorData.response?.message ||
          `HTTP ${response.status}: ${response.statusText}`;

        if (response.status === 403 && retryWithAltAuth) {
          const altMethod = this.authMethod === 'apikey' ? 'bearer' : 'apikey';
          console.log(`Auth failed with ${this.authMethod}, trying ${altMethod}...`);

          const altController = new AbortController();
          const altTimeoutId = setTimeout(() => altController.abort(), this.timeout);

          try {
            const altResponse = await fetch(`${this.baseUrl}${endpoint}`, {
              ...options,
              headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders(altMethod),
                ...options.headers,
              },
              signal: altController.signal,
            });

            clearTimeout(altTimeoutId);

            if (altResponse.ok) {
              this.authMethod = altMethod;
              return altResponse.json();
            }
          } catch {
            clearTimeout(altTimeoutId);
          }

          throw new EvolutionAPIError(
            `Authentication failed: ${errorMessage}. Please verify your API key is correct and matches your Evolution API configuration.`,
            response.status,
            'AUTH_FAILED'
          );
        }

        if (response.status === 403) {
          throw new EvolutionAPIError(
            `Authentication failed: ${errorMessage}. Please verify your API key is correct.`,
            response.status,
            'AUTH_FAILED'
          );
        }

        throw new EvolutionAPIError(
          errorMessage,
          response.status,
          errorData.code
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof EvolutionAPIError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new EvolutionAPIError('Request timeout', 408, 'TIMEOUT');
      }
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new EvolutionAPIError(
          `Could not connect to Evolution API at ${this.baseUrl}. Please verify the URL is correct and accessible.`,
          0,
          'CONNECTION_FAILED'
        );
      }
      throw new EvolutionAPIError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async testConnection(): Promise<{ success: boolean; version?: string; message?: string }> {
    try {
      const instances = await this.getInstances();
      return {
        success: true,
        message: `Connected successfully. Found ${Array.isArray(instances) ? instances.length : 0} instance(s).`
      };
    } catch (error) {
      if (error instanceof EvolutionAPIError) {
        return { success: false, message: error.message };
      }
      return { success: false, message: 'Unknown connection error' };
    }
  }

  async createInstance(
    instanceName: string,
    options?: {
      qrcode?: boolean;
      integration?: string;
      webhookUrl?: string;
      webhookEvents?: string[];
    }
  ): Promise<{ instance: EvolutionInstance; qrcode?: EvolutionQRCode; hash?: { apikey: string } }> {
    return this.request('/instance/create', {
      method: 'POST',
      body: JSON.stringify({
        instanceName,
        qrcode: options?.qrcode ?? true,
        integration: options?.integration || 'WHATSAPP-BAILEYS',
        webhook: options?.webhookUrl
          ? {
              url: options.webhookUrl,
              byEvents: true,
              base64: false,
              events: options.webhookEvents || [
                'MESSAGES_UPSERT',
                'MESSAGES_UPDATE',
                'CONNECTION_UPDATE',
                'QRCODE_UPDATED',
              ],
            }
          : undefined,
      }),
    });
  }

  async getInstances(): Promise<EvolutionInstance[]> {
    return this.request('/instance/fetchInstances');
  }

  async getInstance(instanceName: string): Promise<EvolutionInstance> {
    return this.request(`/instance/fetchInstances?instanceName=${instanceName}`);
  }

  async connectInstance(instanceName: string): Promise<EvolutionQRCode> {
    return this.request(`/instance/connect/${instanceName}`, {
      method: 'GET',
    });
  }

  async getConnectionState(
    instanceName: string
  ): Promise<EvolutionConnectionState> {
    return this.request(`/instance/connectionState/${instanceName}`);
  }

  async logoutInstance(instanceName: string): Promise<{ status: string }> {
    return this.request(`/instance/logout/${instanceName}`, {
      method: 'DELETE',
    });
  }

  async restartInstance(instanceName: string): Promise<{ status: string }> {
    return this.request(`/instance/restart/${instanceName}`, {
      method: 'PUT',
    });
  }

  async deleteInstance(instanceName: string): Promise<{ status: string }> {
    return this.request(`/instance/delete/${instanceName}`, {
      method: 'DELETE',
    });
  }

  async setWebhook(
    instanceName: string,
    config: WebhookConfig
  ): Promise<{ webhook: WebhookConfig }> {
    return this.request(`/webhook/set/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(config),
    });
  }

  async getWebhook(instanceName: string): Promise<WebhookConfig | null> {
    return this.request(`/webhook/find/${instanceName}`);
  }

  async getChats(instanceName: string): Promise<EvolutionChat[]> {
    return this.request(`/chat/findChats/${instanceName}`);
  }

  async getMessages(
    instanceName: string,
    remoteJid: string,
    count?: number
  ): Promise<EvolutionMessage[]> {
    return this.request(`/chat/findMessages/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({
        where: { key: { remoteJid } },
        limit: count || 50,
      }),
    });
  }

  async sendText(
    instanceName: string,
    payload: SendTextPayload
  ): Promise<{ key: { id: string } }> {
    return this.request(`/message/sendText/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendMedia(
    instanceName: string,
    payload: SendMediaPayload
  ): Promise<{ key: { id: string } }> {
    return this.request(`/message/sendMedia/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async markAsRead(
    instanceName: string,
    remoteJid: string,
    messageIds: string[]
  ): Promise<void> {
    await this.request(`/chat/markMessageAsRead/${instanceName}`, {
      method: 'PUT',
      body: JSON.stringify({
        readMessages: messageIds.map((id) => ({
          remoteJid,
          id,
        })),
      }),
    });
  }

  async getContacts(instanceName: string): Promise<EvolutionContact[]> {
    return this.request(`/chat/findContacts/${instanceName}`);
  }

  async getProfilePicture(
    instanceName: string,
    number: string
  ): Promise<{ profilePictureUrl: string } | null> {
    try {
      return await this.request(`/chat/fetchProfilePictureUrl/${instanceName}`, {
        method: 'POST',
        body: JSON.stringify({ number }),
      });
    } catch {
      return null;
    }
  }

  async getGroups(instanceName: string): Promise<EvolutionGroup[]> {
    return this.request(`/group/fetchAllGroups/${instanceName}?getParticipants=true`);
  }

  async getGroupInfo(
    instanceName: string,
    groupJid: string
  ): Promise<EvolutionGroup> {
    return this.request(`/group/findGroupInfos/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ groupJid }),
    });
  }

  async isOnWhatsApp(
    instanceName: string,
    numbers: string[]
  ): Promise<Array<{ exists: boolean; jid: string }>> {
    return this.request(`/chat/whatsappNumbers/${instanceName}`, {
      method: 'POST',
      body: JSON.stringify({ numbers }),
    });
  }
}

export function createEvolutionAPI(config: EvolutionConfig): EvolutionAPI {
  return new EvolutionAPI(config);
}

export function createEvolutionAPIFromEnv(): EvolutionAPI | null {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl || !apiKey) {
    return null;
  }

  return new EvolutionAPI({ baseUrl, apiKey });
}

export function getEvolutionAPI(): EvolutionAPI {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;

  if (!baseUrl) {
    throw new Error(
      'EVOLUTION_API_URL environment variable is not set. Please configure it in your .env file.'
    );
  }

  if (!apiKey) {
    throw new Error(
      'EVOLUTION_API_KEY environment variable is not set. Please configure it in your .env file.'
    );
  }

  return new EvolutionAPI({ baseUrl, apiKey });
}