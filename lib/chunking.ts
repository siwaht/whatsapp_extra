export interface ChunkingOptions {
  chunkSize: number;
  chunkOverlap: number;
  separators?: string[];
}

export interface Chunk {
  content: string;
  index: number;
  tokenCount: number;
  metadata: {
    startChar: number;
    endChar: number;
  };
}

const DEFAULT_SEPARATORS = ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' ', ''];

function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

function splitBySeparator(text: string, separator: string): string[] {
  if (separator === '') {
    return text.split('');
  }
  return text.split(separator);
}

function recursiveSplit(
  text: string,
  separators: string[],
  chunkSize: number
): string[] {
  const separator = separators[0];
  const remainingSeparators = separators.slice(1);

  const splits = splitBySeparator(text, separator);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const split of splits) {
    const potentialChunk = currentChunk
      ? currentChunk + separator + split
      : split;

    if (estimateTokenCount(potentialChunk) <= chunkSize) {
      currentChunk = potentialChunk;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
      }

      if (estimateTokenCount(split) > chunkSize && remainingSeparators.length > 0) {
        const subChunks = recursiveSplit(split, remainingSeparators, chunkSize);
        chunks.push(...subChunks);
        currentChunk = '';
      } else {
        currentChunk = split;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}

export function chunkText(text: string, options: ChunkingOptions): Chunk[] {
  const { chunkSize, chunkOverlap, separators = DEFAULT_SEPARATORS } = options;

  if (!text || text.trim().length === 0) {
    return [];
  }

  const rawChunks = recursiveSplit(text, separators, chunkSize);
  const chunks: Chunk[] = [];
  let charOffset = 0;

  for (let i = 0; i < rawChunks.length; i++) {
    const content = rawChunks[i].trim();
    if (!content) continue;

    const startChar = text.indexOf(content, charOffset);
    const endChar = startChar + content.length;

    chunks.push({
      content,
      index: chunks.length,
      tokenCount: estimateTokenCount(content),
      metadata: {
        startChar,
        endChar,
      },
    });

    charOffset = Math.max(charOffset, endChar - chunkOverlap * 4);
  }

  if (chunkOverlap > 0 && chunks.length > 1) {
    const overlappedChunks: Chunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      let content = chunks[i].content;

      if (i > 0) {
        const prevChunk = chunks[i - 1].content;
        const overlapText = prevChunk.slice(-chunkOverlap * 4);
        const overlapIndex = content.indexOf(overlapText.slice(-50));
        if (overlapIndex === -1) {
          content = overlapText + ' ' + content;
        }
      }

      overlappedChunks.push({
        ...chunks[i],
        content: content.trim(),
        tokenCount: estimateTokenCount(content),
      });
    }

    return overlappedChunks;
  }

  return chunks;
}

export const CHUNKING_PRESETS = {
  small: {
    chunkSize: 256,
    chunkOverlap: 32,
    description: 'Small chunks (256 tokens) - Better for precise retrieval',
  },
  medium: {
    chunkSize: 512,
    chunkOverlap: 64,
    description: 'Medium chunks (512 tokens) - Balanced approach',
  },
  large: {
    chunkSize: 1024,
    chunkOverlap: 128,
    description: 'Large chunks (1024 tokens) - More context per chunk',
  },
  paragraph: {
    chunkSize: 2048,
    chunkOverlap: 200,
    description: 'Paragraph-level (2048 tokens) - Natural text boundaries',
  },
};

export type ChunkingPreset = keyof typeof CHUNKING_PRESETS;
