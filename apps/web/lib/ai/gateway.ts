import { createGateway } from '@ai-sdk/gateway';

// AI Gateway is the only entrypoint for model traffic. Plain `'provider/model'`
// strings unlock per-feature spend caps, provider failover, ZDR contracts, and
// unified observability. Never import @ai-sdk/anthropic / @ai-sdk/openai
// directly.

export const MODELS = {
  haiku: 'anthropic/claude-haiku-4-5',
  sonnet: 'anthropic/claude-sonnet-4-6',
  embeddingLarge: 'openai/text-embedding-3-large',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

// Singleton gateway client. Token auto-injected on Vercel; locally set
// AI_GATEWAY_API_KEY via `vercel env pull`.
export const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY,
});
