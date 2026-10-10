import { describe, it, expect, vi, beforeEach } from 'vitest';

const m = vi.hoisted(() => ({ embed: vi.fn() }));
vi.mock('ai', () => ({ embed: m.embed }));
vi.mock('@/lib/ai/gateway', () => ({
  gateway: { embeddingModel: (id: string) => ({ id }) },
  MODELS: { embedding: 'openai/text-embedding-3-small' },
  aiProviderOptions: (extra: Record<string, unknown> = {}) => ({ ...extra }),
}));

import {
  EMBEDDING_DIMENSIONS,
  EmbeddingShapeError,
  assertEmbeddingShape,
  embedText,
  toVectorLiteral,
} from '@/lib/ai/embeddings';

const vec = (n: number) => Array.from({ length: n }, () => 0.5);

describe('embedding contract', () => {
  beforeEach(() => vi.clearAllMocks());

  it('the column width is 1536 (matches vector(1536) in the migrations)', () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it('rejects the 3072-wide vector text-embedding-3-large returns by default', () => {
    expect(() => assertEmbeddingShape(vec(3072), 'openai/text-embedding-3-large')).toThrow(
      EmbeddingShapeError,
    );
    expect(() => assertEmbeddingShape(vec(3072), 'm')).toThrow(/3072 dimensions.*vector\(1536\)/);
  });

  it('rejects non-finite components', () => {
    const v = vec(1536);
    v[7] = Number.NaN;
    expect(() => assertEmbeddingShape(v, 'm')).toThrow(/non-finite/);
  });

  it('asks the provider for the column width and returns the model that answered', async () => {
    m.embed.mockResolvedValue({ embedding: vec(1536) });
    const r = await embedText('hello');
    expect(r.model).toBe('openai/text-embedding-3-small');
    const arg = m.embed.mock.calls[0]![0];
    expect(arg.providerOptions).toEqual({ openai: { dimensions: 1536 } });
    expect(arg.value).toBe('hello');
  });

  it('fails AT THE CALL when the model returns the wrong width, not in a later SQL UPDATE', async () => {
    m.embed.mockResolvedValue({ embedding: vec(3072) });
    await expect(embedText('hello')).rejects.toBeInstanceOf(EmbeddingShapeError);
  });

  it('bounds the input so one document cannot become a provider error', async () => {
    m.embed.mockResolvedValue({ embedding: vec(1536) });
    await embedText('x'.repeat(100_000));
    expect(m.embed.mock.calls[0]![0].value.length).toBeLessThanOrEqual(20_000);
  });

  it('renders the pgvector text literal', () => {
    expect(toVectorLiteral([0.1, 0.2, -3])).toBe('[0.1,0.2,-3]');
  });
});
