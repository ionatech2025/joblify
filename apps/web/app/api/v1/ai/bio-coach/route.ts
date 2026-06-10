import { streamText, type UIMessage, convertToModelMessages } from 'ai';
import { requireRole } from '@/lib/auth';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { BIO_COACH_SYSTEM } from '@/lib/ai/prompts/bio-coach';
import { applyLimit } from '@/lib/ratelimit';

export const maxDuration = 60;

export async function POST(req: Request) {
  const user = await requireRole('JOB_SEEKER');

  const rl = await applyLimit(`bio-coach:${user.id}`);
  if (!rl.success) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  const { messages, currentBio }: { messages: UIMessage[]; currentBio?: string } = await req.json();

  const system =
    BIO_COACH_SYSTEM +
    (currentBio ? `\n\nThe user's current bio: """${currentBio}"""` : '\n\nThe user has no bio yet.');

  const result = streamText({
    model: gateway(MODELS.sonnet),
    system,
    messages: await convertToModelMessages(messages),
    temperature: 0.4,
    maxOutputTokens: 600,
  });

  return result.toUIMessageStreamResponse();
}
