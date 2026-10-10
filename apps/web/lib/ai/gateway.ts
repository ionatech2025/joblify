import { createGateway } from 'ai';

// AI Gateway is the only entrypoint for model traffic. Plain `'provider/model'`
// strings unlock per-feature spend caps, provider failover, ZDR routing and
// unified observability. Never import @ai-sdk/anthropic / @ai-sdk/openai
// directly.
//
// `createGateway` comes from `ai` itself. This file used to import it from a
// separately-installed `@ai-sdk/gateway@1`, which is a different major from the
// copy `ai@6` bundles — two gateway implementations in one bundle, one of them
// speaking an older provider spec.
//
// SLUGS ARE THE GATEWAY'S CANONICAL IDS, NOT ANTHROPIC'S. The Gateway catalog
// (GET https://ai-gateway.vercel.sh/v1/models) lists Claude models with dots —
// `anthropic/claude-haiku-5.5` — whereas Anthropic's own API uses dashes. The
// dashed spellings this file used to carry (`claude-haiku-4-5`) are not in the
// catalog, so every parse/coach/skills call rejected and the callers' broad
// `catch` quietly routed to the heuristic fallback. Verify a slug against the
// live catalog before changing a default.
//
// Each id can be overridden per environment without a deploy of code:
//   AI_MODEL_FAST       resume parse, JD skill extraction
//   AI_MODEL_SMART      bio coach
//   AI_MODEL_EMBEDDING  must emit EMBEDDING_DIMENSIONS-wide vectors
export const MODELS = {
  haiku: process.env.AI_MODEL_FAST ?? 'anthropic/claude-haiku-5.5',
  sonnet: process.env.AI_MODEL_SMART ?? 'anthropic/claude-sonnet-5.5',
  // text-embedding-3-small is natively 1536-wide, matching the vector(1536)
  // columns. (-3-large is 3072-wide by default and pgvector rejects the write.)
  embedding: process.env.AI_MODEL_EMBEDDING ?? 'openai/text-embedding-3-small',
} as const;

export type ModelId = string;

// Singleton gateway client. Token auto-injected on Vercel (OIDC); locally set
// AI_GATEWAY_API_KEY via `vercel env pull`.
export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});

type ProviderOptions = Record<string, Record<string, string | number | boolean>>;

/**
 * Per-request provider options shared by every model call.
 *
 * `AI_GATEWAY_ZDR=1` routes only through providers with a zero-data-retention
 * agreement (resumes are personal data, and /legal/processors promises ZDR).
 * It is opt-in because ZDR routing is a Pro/Enterprise Gateway feature and the
 * Gateway fails the request closed when no ZDR provider is available — turning
 * it on for a plan that lacks it would disable every AI feature.
 */
export function aiProviderOptions(extra: ProviderOptions = {}): ProviderOptions {
  const zdr = process.env.AI_GATEWAY_ZDR === '1';
  return {
    ...extra,
    ...(zdr ? { gateway: { zeroDataRetention: true } } : {}),
  };
}
