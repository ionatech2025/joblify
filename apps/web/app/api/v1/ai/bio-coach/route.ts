import { streamText, convertToModelMessages, type UIMessage } from 'ai';
import { z } from 'zod';
import { requireRole, AuthError } from '@/lib/auth';
import { aiModelFor, logAiCall } from '@/lib/ai/groq';
import { BIO_COACH_SYSTEM } from '@/lib/ai/prompts/bio-coach';
import { fenceUntrusted, sanitizeUntrustedText, untrustedInputNotice } from '@/lib/ai/untrusted';
import { bioCoachLimit } from '@/lib/ratelimit';

export const maxDuration = 60;

// Every call is a paid completion on a model chosen for quality, behind a
// per-user hourly limit — so the *size* of each call has to be bounded too, or
// "30 requests an hour" is "30 requests of any length an hour". The limits
// below cap what a single user can make one call cost.
const MAX_TURNS = 12; // most recent messages kept as context
const MAX_MESSAGE_CHARS = 4_000;
const MAX_BIO_CHARS = 3_000;
const MAX_BODY_BYTES = 64 * 1024;

// The client is untrusted: it supplies the conversation history, so it could
// also supply `system` or forged `assistant` turns. Only user/assistant text
// parts are accepted; anything else is dropped, not forwarded.
const Part = z.object({ type: z.string(), text: z.string().optional() }).passthrough();
const Message = z.object({
  id: z.string().max(200).optional(),
  role: z.enum(['user', 'assistant']),
  parts: z.array(Part).max(16),
});
const Body = z.object({
  messages: z.array(Message).min(1).max(100),
  currentBio: z.string().max(MAX_BIO_CHARS).optional(),
});

export async function POST(req: Request) {
  let user;
  try {
    user = await requireRole('JOB_SEEKER');
  } catch (err) {
    if (err instanceof AuthError) {
      return new Response('Forbidden', { status: err.code === 'UNAUTHENTICATED' ? 401 : 403 });
    }
    throw err;
  }

  const rl = await bioCoachLimit(user.id);
  if (!rl.success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const declared = Number(req.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) return new Response('Request too large', { status: 413 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return new Response('Invalid request', { status: 400 });

  // Keep only text parts, bound each message, and keep only the latest turns.
  const history: UIMessage[] = parsed.data.messages
    .map((m) => ({
      id: m.id ?? crypto.randomUUID(),
      role: m.role,
      parts: m.parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => ({
          type: 'text' as const,
          text: sanitizeUntrustedText(p.text as string, MAX_MESSAGE_CHARS),
        }))
        .filter((p) => p.text.length > 0),
    }))
    .filter((m) => m.parts.length > 0)
    .slice(-MAX_TURNS);

  if (history.length === 0 || history[history.length - 1]!.role !== 'user') {
    return new Response('Invalid request', { status: 400 });
  }

  // The bio is user-supplied text, so it is DATA — fenced and described as such
  // in the system prompt — not a clause of the prompt itself. (It used to be
  // concatenated straight into the system role between triple quotes.)
  const bio = parsed.data.currentBio
    ? sanitizeUntrustedText(parsed.data.currentBio, MAX_BIO_CHARS)
    : '';
  const system = [
    BIO_COACH_SYSTEM,
    untrustedInputNotice('current-bio'),
    bio
      ? `The user's current bio is below.\n${fenceUntrusted('current-bio', bio)}`
      : 'The user has no bio yet.',
  ].join('\n\n');

  // Groq models first when selected (AI_PROVIDER_BIO_COACH=groq + GROQ_API_KEY),
  // falling back through the chain to the Gateway model — see lib/ai/groq.ts.
  const { model, providerOptions } = aiModelFor('bio-coach');
  const startedAt = Date.now();
  const result = streamText({
    model,
    system,
    messages: await convertToModelMessages(history),
    temperature: 0.4,
    maxOutputTokens: 600,
    providerOptions,
    onFinish: ({ response, usage, finishReason }) =>
      logAiCall('bio-coach', { response, usage, finishReason, startedAt }),
  });

  return result.toUIMessageStreamResponse();
}
