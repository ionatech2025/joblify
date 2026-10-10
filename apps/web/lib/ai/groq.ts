import { createGroq } from '@ai-sdk/groq';
import type { LanguageModelV3 } from '@ai-sdk/provider';
import { gateway, MODELS, aiProviderOptions } from '@/lib/ai/gateway';
import { logger } from '@/lib/observability/logger';
import { TASK_ENV, groqEnabledFor, type AiTask } from '@/lib/ai/groq-config';

export { groqEnabledFor, type AiTask };

// Per-task model chains: Groq first (latency is the point), the Gateway model
// last (the quality/availability floor the app already ran on).
//
// This is the one deliberate exception to "all model traffic goes through the
// AI Gateway" in gateway.ts: Groq is called with its own key, so it is a
// separate processor and a separate bill. It is opt-in per task and never the
// default, because moving a task to it changes who receives that task's data —
// /legal/processors must list Groq before AI_PROVIDER_<TASK>=groq is set in
// production.
//
// Ids come from Groq's own catalog (GET /openai/v1/models), checked 2026-10-10
// with this project's key. llama-3.3-70b-versatile is NOT in it any more: a call
// returns 404 model_not_found, which is why the chains below are what they are
// and why every chain has a Gateway model at its end.

const TASKS: Record<AiTask, { groq: string[]; gateway: string; reasoning: 'low' | 'medium' }> = {
  // Streams to someone watching it type; wants the strongest model.
  'bio-coach': {
    groq: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'],
    gateway: MODELS.sonnet,
    reasoning: 'low',
  },
  // Structured JSON from a whole résumé; accuracy over speed.
  'resume-parse': {
    groq: ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'],
    gateway: MODELS.haiku,
    reasoning: 'low',
  },
  // Short structured extraction on every job post; the small fast model.
  'skill-extraction': {
    groq: ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
    gateway: MODELS.haiku,
    reasoning: 'low',
  },
};

let client: ReturnType<typeof createGroq> | null = null;

/** The Groq provider, or null when GROQ_API_KEY is not configured. */
export function groq() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  client ??= createGroq({ apiKey });
  return client;
}

/** Groq ids for `task`: AI_GROQ_MODELS_<TASK> (comma-separated) or the defaults. */
export function groqModelIds(task: AiTask): string[] {
  const override = process.env[`AI_GROQ_MODELS_${TASK_ENV[task]}`];
  const ids = override
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return ids?.length ? ids : TASKS[task].groq;
}

/**
 * A model that tries each of `models` in order and returns the first to
 * answer. Errors thrown while *starting* a call (404 model_not_found, 429,
 * 5xx, a network failure) move on to the next; an aborted request does not.
 * For streams that means fallback applies up to the first byte — a stream that
 * breaks half-way is a failed call, not a retry that would restart the text.
 */
export function withFallback(models: LanguageModelV3[]): LanguageModelV3 {
  const first = models[0]!;
  const attempt = async <T>(
    run: (m: LanguageModelV3) => PromiseLike<T>,
    signal: AbortSignal | undefined,
    operation: string,
  ): Promise<T> => {
    let lastError: unknown;
    for (const [i, m] of models.entries()) {
      try {
        return await run(m);
      } catch (err) {
        if (signal?.aborted) throw err;
        lastError = err;
        logger.warn(
          { err, model: m.modelId, provider: m.provider, operation, next: models[i + 1]?.modelId },
          'ai model failed — falling back',
        );
      }
    }
    throw lastError;
  };

  return {
    specificationVersion: 'v3',
    provider: 'fallback',
    modelId: models.map((m) => m.modelId).join(' > '),
    supportedUrls: first.supportedUrls,
    doGenerate: (options) => attempt((m) => m.doGenerate(options), options.abortSignal, 'generate'),
    doStream: (options) => attempt((m) => m.doStream(options), options.abortSignal, 'stream'),
  };
}

/**
 * The model + provider options to hand to generateObject / streamText for
 * `task`. Provider options are keyed by provider, so one object serves every
 * model in the chain: Groq reads `groq`, the Gateway reads `gateway`.
 */
export function aiModelFor(task: AiTask): {
  model: LanguageModelV3;
  providerOptions: ReturnType<typeof aiProviderOptions>;
} {
  const cfg = TASKS[task];
  const gatewayModel = gateway(cfg.gateway);
  const provider = groqEnabledFor(task) ? groq() : null;
  const models = provider
    ? [...groqModelIds(task).map((id) => provider(id)), gatewayModel]
    : [gatewayModel];
  return {
    model: models.length === 1 ? gatewayModel : withFallback(models),
    providerOptions: aiProviderOptions({ groq: { reasoningEffort: cfg.reasoning } }),
  };
}

type Usage = { inputTokens?: number; outputTokens?: number; totalTokens?: number };

/**
 * One structured log line per finished AI call: which model *actually*
 * answered (after any fallback), what it cost in tokens, and how long it took.
 * Metadata only — never the prompt or the output, which are personal data.
 *
 * `response.modelId` is what the provider reported, so a call that fell back
 * from Groq to the Gateway says so here, where the chain's own name
 * ("a > b > c") would not. This is how "is Groq really serving this?" is
 * answered in production without reading anyone's text.
 */
export function logAiCall(
  task: AiTask,
  call: {
    response?: { modelId?: string };
    usage?: Usage;
    finishReason?: string;
    startedAt: number;
  },
): void {
  logger.info(
    {
      task,
      model: call.response?.modelId ?? 'unknown',
      viaGroq: Boolean(groqEnabledFor(task)),
      inputTokens: call.usage?.inputTokens,
      outputTokens: call.usage?.outputTokens,
      finishReason: call.finishReason,
      ms: Date.now() - call.startedAt,
    },
    'ai call',
  );
}
