const PICA_API_BASE = 'https://api.picaos.com/v1';

export interface PicaCredentials {
  secretKey: string;
  weaviateConnectionKey: string;
}

export interface WeaviateObject {
  class: string;
  properties: Record<string, unknown>;
  id?: string;
  vector?: number[];
}

export interface WeaviateSearchResult {
  id: string;
  properties: Record<string, unknown>;
  score?: number;
}

async function picaRequest(
  endpoint: string,
  credentials: PicaCredentials,
  actionId: string,
  body: unknown
): Promise<unknown> {
  const response = await fetch(`${PICA_API_BASE}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-pica-secret': credentials.secretKey,
      'x-pica-connection-key': credentials.weaviateConnectionKey,
      'x-pica-action-id': actionId,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Pica API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function createWeaviateObject(
  credentials: PicaCredentials,
  obj: WeaviateObject
): Promise<{ id: string }> {
  const result = await picaRequest(
    '/passthrough',
    credentials,
    'weaviate_create_object',
    {
      requestBody: obj,
    }
  );
  return result as { id: string };
}

export async function createWeaviateObjectBatch(
  credentials: PicaCredentials,
  objects: WeaviateObject[]
): Promise<{ id: string }[]> {
  const result = await picaRequest(
    '/passthrough',
    credentials,
    'weaviate_batch_create',
    {
      requestBody: {
        objects,
      },
    }
  );
  return result as { id: string }[];
}

export async function deleteWeaviateObject(
  credentials: PicaCredentials,
  className: string,
  id: string
): Promise<void> {
  await picaRequest(
    '/passthrough',
    credentials,
    'weaviate_delete_object',
    {
      pathParams: {
        className,
        id,
      },
    }
  );
}

export async function deleteWeaviateObjectsBatch(
  credentials: PicaCredentials,
  className: string,
  ids: string[]
): Promise<void> {
  await picaRequest(
    '/passthrough',
    credentials,
    'weaviate_batch_delete',
    {
      requestBody: {
        match: {
          class: className,
          where: {
            operator: 'ContainsAny',
            path: ['id'],
            valueTextArray: ids,
          },
        },
      },
    }
  );
}

export async function searchWeaviate(
  credentials: PicaCredentials,
  className: string,
  query: string,
  limit: number = 5,
  properties: string[] = ['content', 'title']
): Promise<WeaviateSearchResult[]> {
  const graphqlQuery = `
    {
      Get {
        ${className}(
          nearText: { concepts: ["${query.replace(/"/g, '\\"')}"] }
          limit: ${limit}
        ) {
          _additional {
            id
            certainty
          }
          ${properties.join('\n          ')}
        }
      }
    }
  `;

  const result = await picaRequest(
    '/passthrough',
    credentials,
    'weaviate_graphql_query',
    {
      requestBody: {
        query: graphqlQuery,
      },
    }
  ) as { data?: { Get?: Record<string, unknown[]> } };

  const items = result?.data?.Get?.[className] || [];
  return items.map((item: unknown) => {
    const typedItem = item as Record<string, unknown>;
    const additional = typedItem._additional as { id: string; certainty?: number } | undefined;
    return {
      id: additional?.id || '',
      properties: typedItem,
      score: additional?.certainty,
    };
  });
}

export async function hybridSearchWeaviate(
  credentials: PicaCredentials,
  className: string,
  query: string,
  limit: number = 5,
  alpha: number = 0.5,
  properties: string[] = ['content', 'title']
): Promise<WeaviateSearchResult[]> {
  const graphqlQuery = `
    {
      Get {
        ${className}(
          hybrid: {
            query: "${query.replace(/"/g, '\\"')}"
            alpha: ${alpha}
          }
          limit: ${limit}
        ) {
          _additional {
            id
            score
          }
          ${properties.join('\n          ')}
        }
      }
    }
  `;

  const result = await picaRequest(
    '/passthrough',
    credentials,
    'weaviate_graphql_query',
    {
      requestBody: {
        query: graphqlQuery,
      },
    }
  ) as { data?: { Get?: Record<string, unknown[]> } };

  const items = result?.data?.Get?.[className] || [];
  return items.map((item: unknown) => {
    const typedItem = item as Record<string, unknown>;
    const additional = typedItem._additional as { id: string; score?: number } | undefined;
    return {
      id: additional?.id || '',
      properties: typedItem,
      score: additional?.score,
    };
  });
}

export async function testPicaConnection(
  credentials: PicaCredentials
): Promise<boolean> {
  try {
    await picaRequest(
      '/passthrough',
      credentials,
      'weaviate_graphql_query',
      {
        requestBody: {
          query: '{ Aggregate { Meta { count } } }',
        },
      }
    );
    return true;
  } catch {
    return false;
  }
}
