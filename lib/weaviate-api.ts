export interface WeaviateDocumentProperties {
  title: string;
  content: string;
  metadata?: {
    tags?: string[];
    createdBy?: string;
    mimeType?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface WeaviateDocument {
  class: string;
  id?: string;
  properties: WeaviateDocumentProperties;
  vector?: number[];
  vectorWeights?: Record<string, number>;
  tenant?: string;
  additional?: Record<string, unknown>;
}

export interface WeaviateResponse {
  class: string;
  id: string;
  properties: WeaviateDocumentProperties;
  vector?: number[];
  creationTimeUnix: number;
}

export interface WeaviateError {
  code: string;
  message: string;
}

export interface WeaviateConfig {
  secretKey: string;
  connectionKey: string;
  actionId?: string;
  timeout?: number;
}

const PICA_BASE_URL = 'https://api.picaos.com/v1/passthrough';
const DEFAULT_ACTION_ID = 'conn_mod_def::GC_6t2UcL3M::lk1uyIPORfaW0ZbperpNpA';

class WeaviateAPIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'WeaviateAPIError';
  }
}

export class WeaviateAPI {
  private secretKey: string;
  private connectionKey: string;
  private actionId: string;
  private timeout: number;

  constructor(config: WeaviateConfig) {
    this.secretKey = config.secretKey;
    this.connectionKey = config.connectionKey;
    this.actionId = config.actionId || DEFAULT_ACTION_ID;
    this.timeout = config.timeout || 30000;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${PICA_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'x-pica-secret': this.secretKey,
          'x-pica-connection-key': this.connectionKey,
          'x-pica-action-id': this.actionId,
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new WeaviateAPIError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData.code
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof WeaviateAPIError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new WeaviateAPIError('Request timeout', 408, 'TIMEOUT');
      }
      throw new WeaviateAPIError(
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  async createDocument(document: WeaviateDocument): Promise<WeaviateResponse> {
    return this.request<WeaviateResponse>('/v1/objects', {
      method: 'POST',
      body: JSON.stringify(document),
    });
  }

  async getDocument(id: string, className?: string): Promise<WeaviateResponse> {
    const params = className ? `?class=${className}` : '';
    return this.request<WeaviateResponse>(`/v1/objects/${id}${params}`, {
      method: 'GET',
    });
  }

  async updateDocument(
    id: string,
    document: Partial<WeaviateDocument>
  ): Promise<WeaviateResponse> {
    return this.request<WeaviateResponse>(`/v1/objects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(document),
    });
  }

  async deleteDocument(id: string, className?: string): Promise<void> {
    const params = className ? `?class=${className}` : '';
    await this.request<void>(`/v1/objects/${id}${params}`, {
      method: 'DELETE',
    });
  }

  async searchDocuments(
    className: string,
    query: {
      nearText?: { concepts: string[]; certainty?: number };
      nearVector?: { vector: number[]; certainty?: number };
      limit?: number;
      offset?: number;
      where?: Record<string, unknown>;
    }
  ): Promise<{ objects: WeaviateResponse[] }> {
    const graphqlQuery = {
      query: `{
        Get {
          ${className}(
            ${query.nearText ? `nearText: { concepts: ${JSON.stringify(query.nearText.concepts)}${query.nearText.certainty ? `, certainty: ${query.nearText.certainty}` : ''} }` : ''}
            ${query.nearVector ? `nearVector: { vector: ${JSON.stringify(query.nearVector.vector)}${query.nearVector.certainty ? `, certainty: ${query.nearVector.certainty}` : ''} }` : ''}
            ${query.limit ? `limit: ${query.limit}` : ''}
            ${query.offset ? `offset: ${query.offset}` : ''}
          ) {
            title
            content
            metadata
            _additional {
              id
              certainty
              creationTimeUnix
            }
          }
        }
      }`,
    };

    const result = await this.request<{
      data: { Get: { [key: string]: Array<Record<string, unknown>> } };
    }>('/v1/graphql', {
      method: 'POST',
      body: JSON.stringify(graphqlQuery),
    });

    const objects = result.data?.Get?.[className] || [];
    return {
      objects: objects.map((obj) => ({
        class: className,
        id: (obj._additional as { id: string })?.id || '',
        properties: {
          title: obj.title as string,
          content: obj.content as string,
          metadata: obj.metadata as WeaviateDocumentProperties['metadata'],
        },
        creationTimeUnix:
          (obj._additional as { creationTimeUnix: number })?.creationTimeUnix || 0,
      })),
    };
  }

  async batchCreateDocuments(
    documents: WeaviateDocument[]
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    const results = await this.request<{
      objects: Array<{ result?: { status: string; errors?: { message: string }[] } }>;
    }>('/v1/batch/objects', {
      method: 'POST',
      body: JSON.stringify({ objects: documents }),
    });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const obj of results.objects || []) {
      if (obj.result?.status === 'SUCCESS') {
        success++;
      } else {
        failed++;
        if (obj.result?.errors) {
          errors.push(...obj.result.errors.map((e) => e.message));
        }
      }
    }

    return { success, failed, errors };
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.request<{ status: string }>('/v1/.well-known/ready', {
        method: 'GET',
      });
      return true;
    } catch {
      return false;
    }
  }
}

export function createWeaviateAPI(config: WeaviateConfig): WeaviateAPI {
  return new WeaviateAPI(config);
}

export function createWeaviateAPIFromEnv(): WeaviateAPI | null {
  const secretKey = process.env.PICA_SECRET_KEY;
  const connectionKey = process.env.PICA_WEAVIATE_CONNECTION_KEY;

  if (!secretKey || !connectionKey) {
    return null;
  }

  return new WeaviateAPI({ secretKey, connectionKey });
}