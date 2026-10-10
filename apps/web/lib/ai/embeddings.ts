import { embed } from 'ai';
import { gateway, MODELS, aiProviderOptions } from '@/lib/ai/gateway';

/**
 * The width of every pgvector `embedding` column (resumes, job_posts). One
 * constant, used for both the request (`dimensions`) and the post-condition
 * check, so the schema and the model can never silently disagree again.
 */
export const EMBEDDING_DIMENSIONS = 1536;

// text-embedding-3-* accept at most 8191 tokens. ~20k characters of English is
// comfortably inside that; the cap exists so one pathological document cannot
// turn into a provider error (or a large bill).
const MAX_EMBED_CHARS = 20_000;

export class EmbeddingShapeError extends Error {
  constructor(
    readonly got: number,
    readonly expected: number,
    readonly model: string,
  ) {
    super(
      `Embedding model "${model}" returned ${got} dimensions but the database column is ` +
        `vector(${expected}). Set AI_MODEL_EMBEDDING to a ${expected}-wide model or pass ` +
        `matching \`dimensions\`.`,
    );
    this.name = 'EmbeddingShapeError';
  }
}

/** Throws unless `vector` is exactly `expected` finite numbers. */
export function assertEmbeddingShape(
  vector: readonly number[],
  model: string,
  expected = EMBEDDING_DIMENSIONS,
): void {
  if (vector.length !== expected) throw new EmbeddingShapeError(vector.length, expected, model);
  for (const n of vector) {
    if (!Number.isFinite(n)) {
      throw new Error(`Embedding from "${model}" contains a non-finite component.`);
    }
  }
}

/** `[0.1,0.2,…]` — the text form pgvector parses with `::vector`. */
export function toVectorLiteral(vector: readonly number[]): string {
  return `[${vector.join(',')}]`;
}

export type EmbeddingResult = { embedding: number[]; model: string };

/**
 * Embed one document. Always validates the result: a mismatched width is an
 * error here, at the call that caused it, instead of a Postgres exception in a
 * raw `UPDATE` three frames away that a caller's `catch` then reports as "AI
 * unavailable".
 */
export async function embedText(value: string): Promise<EmbeddingResult> {
  const model = MODELS.embedding;
  const { embedding } = await embed({
    model: gateway.embeddingModel(model),
    value: value.slice(0, MAX_EMBED_CHARS),
    providerOptions: aiProviderOptions({ openai: { dimensions: EMBEDDING_DIMENSIONS } }),
  });
  assertEmbeddingShape(embedding, model);
  return { embedding, model };
}
