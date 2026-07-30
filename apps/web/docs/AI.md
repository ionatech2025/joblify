# AI

All model traffic flows through Vercel AI Gateway. Plain `'provider/model'` strings. Per-feature spend caps, automatic provider failover, ZDR contracts, unified observability.

## Gateway is the only entrypoint

```ts
// lib/ai/gateway.ts
import { createGateway } from '@ai-sdk/gateway';
export const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
```

Never import `@ai-sdk/anthropic`, `@ai-sdk/openai`, or any other provider SDK directly. The gateway gives us:

- Per-feature budget caps in the Vercel dashboard.
- Provider failover (Anthropic primary → OpenAI fallback) without code changes.
- One bill, one place to audit usage.
- Zero-data-retention contracts on the providers we route through.
- Cache breakpoint observability.

## Models we use

| Alias            | Model string                    | Where                                                |
| ---------------- | ------------------------------- | ---------------------------------------------------- |
| `haiku`          | `anthropic/claude-haiku-4-5`    | Cheap structured extraction: resume parse, JD skills |
| `sonnet`         | `anthropic/claude-sonnet-4-6`   | Assistant features: bio coach                        |
| `embeddingLarge` | `openai/text-embedding-3-large` | 1536-dim embeddings for match score                  |

Aliases live in `lib/ai/gateway.ts` `MODELS` so we can swap a model in one place if a cheaper / better option ships.

## V1 features

### 1. Resume parse (workflow)

`workflows/resume-parse.workflow.ts`. Triggered by the apply Server Action after a fresh resume upload; the algolia-reconcile cron's sweep re-runs resumes stranded half-processed (`parsedJson`/`embedding` NULL), capped at 5 attempts per resume.

- Input: a `Resume` row pointing at a Blob URL.
- Steps: download → `file-type` magic-byte check → text extract (pdf-parse / mammoth) → `generateObject` with `ResumeSchema` via Haiku → write `parsedJson` + `embedding`.
- Output: structured resume fields + a 1536-dim embedding in pgvector.
- Cost: ~$0.001 per resume.

Prompt cache strategy: system prompt + Zod schema are stable; they're cached. Resume text is the dynamic part.

### 2. JD → required skills (inline)

`app/actions/post-job.ts:extractAndLinkSkills`. Runs inline after `jobPost.create`.

- Input: title + description + requirements text.
- Steps: `generateObject` via Haiku with `JdSkillsSchema` → match against canonical `Skill` catalogue → upsert `JobPostSkill` rows.
- Output: linked skill rows with `weight = 2` (required) or `weight = 1` (nice-to-have).
- Cost: ~$0.0005 per job.

Best-effort. If Haiku fails, the job is still posted; skills can be linked later via a backfill.

### 3. Match score (workflow)

`workflows/match-score.workflow.ts`. `runMatchScore` is triggered on apply; its JD-embedding step is the exported `embedJobPost`, which also runs on JD publish and on edits that change the JD text (post-job Server Action, inside `after()`) and from the algolia-reconcile sweep over published jobs with a NULL embedding — so never-applied jobs still surface in `/jobseeker/matches`.

- Input: `{ jobPostId, jobSeekerId }`.
- Steps:
  1. Look up resume embedding (latest non-deleted, `embedding IS NOT NULL`).
  2. Look up JD embedding; compute + persist if missing.
  3. Cosine similarity in code or via pgvector `<=>` operator.
  4. Write `JobApplication.matchScore` if the application row exists.
- Output: a 0–1 score.
- Cost: ~$0.0001 per JD embed (one-shot); cosine compute is free.

Hot read path on `/jobs/[slug]` (authenticated jobseeker): inline SQL `1 - (r.embedding <=> j.embedding)` — no Gateway call.

### 4. Bio coach (streaming chat)

`api/v1/ai/bio-coach/route.ts`. Powered by `ai`'s `streamText` + `@ai-sdk/react`'s `useChat` on the client.

- Input: chat messages + the user's current bio as a system seed.
- Model: Sonnet via Gateway, temperature 0.4, maxOutputTokens 600.
- Output: streamed text via UI Message Stream.
- Cost: ~$0.005 per turn.

Rate-limited via `applyLimit(\`bio-coach:${userId}\`)` to keep budget bounded.

## Prompt cache strategy

All prompts follow this layout for prompt caching:

```
[STABLE — cached]
System instructions
Output schema description
Few-shot examples (if any)
Domain context (e.g. user's headline, current bio, JD)

[VOLATILE — not cached]
User turn / dynamic input
```

The stable block is the cache breakpoint. Aim for >70% cache hits on multi-turn chats and batch operations. Verify in the AI Gateway dashboard's cache-hit metric.

## Output schemas

Every structured-output call uses a Zod schema. Co-located with the prompt:

```
lib/ai/prompts/
├── resume-parse.ts    # ResumeSchema  + RESUME_PARSE_SYSTEM
├── jd-skills.ts       # JdSkillsSchema + JD_SKILLS_SYSTEM
└── bio-coach.ts       # BIO_COACH_SYSTEM (no schema — free-form chat)
```

The schema is the contract. Prompt updates that change the output shape require updating the schema in the same PR.

## Cost management

- **Budget caps in Vercel AI Gateway**: set monthly caps per feature; alerts at 50/75/90%.
- **Switch to cheaper model**: when Haiku spend on resume parse crosses $200/mo, evaluate `openai/gpt-4.1-mini` or a smaller Anthropic model — change `MODELS.haiku` in `lib/ai/gateway.ts`. Run the e2e + a sample-set quality regression before promoting.
- **Cache breakpoints**: keep the stable prompt block at the top; never interleave user input with system instructions.
- **Workflow idempotency**: workflows run off the response path via `after()` and are best-effort (failures are logged; the algolia-reconcile cron is the search backstop). They're written idempotent — re-running skips already-parsed/scored rows — so the future Workflow DevKit retry policy won't double-bill.

Estimated costs at 10k MAU, ~500 applies/day:

- Resume parse: ~$0.50/day
- JD skills: ~$0.25/day (per job post)
- Match score: ~$0.05/day
- Bio coach: ~$2-5/day (heavier reasoning, fewer users)

Total AI budget V1: ~$100-300/month. Re-evaluate at 100k MAU.

## Workflows vs inline

| Use a workflow if…                   | Use inline if…               |
| ------------------------------------ | ---------------------------- |
| The operation takes > 5 s            | Synchronous result needed    |
| Multiple steps with possible retries | Single API call              |
| External file processing involved    | Pure prompt → response       |
| The user shouldn't wait              | The user is actively waiting |

Resume parse → workflow (file I/O, multiple steps, retries). JD skill extraction → inline (fast, single call, save runs end-to-end fast for the company). Match score → workflow when triggered from apply (user is redirecting anyway); inline on hot read when both embeddings exist.

## Tool use (future)

V1 doesn't ship agents. When recruiter screening summaries land in V1.5, we'll use AI SDK's `tools` API:

```ts
const result = await generateText({
  model: gateway(MODELS.sonnet),
  tools: {
    getResume: tool({
      description: '...',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => db.resume.findUnique({ where: { id } }),
    }),
    getJob: tool({ ... }),
  },
  messages: [...],
});
```

Pattern: tools are typed adapters around `db.*`. The model decides which to call.

## Streaming

Use `streamText` + `toUIMessageStreamResponse()` for chat / streaming UI. Client uses `@ai-sdk/react`'s `useChat` (AI SDK **v6** — `@ai-sdk/react@^3` paired with `ai@^6`). v6 dropped `input`/`handleInputChange`/`handleSubmit`: you own the input state and call `sendMessage`, and messages carry `parts` (not `content`):

```ts
const [input, setInput] = useState('');
const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/v1/ai/bio-coach', body: { currentBio } }),
});
// submit:  sendMessage({ text: input })
// render:  m.parts.map((p) => (p.type === 'text' ? p.text : null))
```

See `app/(authenticated)/jobseeker/profile/bio-coach.tsx` for the canonical pattern.

## Safety

- **PII**: don't send raw resumes to the model with explicit PII redaction; the resume content is the value. We rely on AI Gateway's ZDR contract with the upstream provider (Anthropic / OpenAI) to enforce no training-data use.
- **Prompt injection**: low risk for V1 features (parse, classify, summarize). When a tool-using agent ships, sandbox tool calls — never give the model a tool that hits a privileged endpoint without a server-side ownership check.
- **Hallucination**: `generateObject` constrains output shape but not content. The resume parser explicitly instructs "Never invent facts."
- **Cost runaway**: per-feature Gateway caps + per-user rate limits in `lib/ratelimit.ts`.

## Adding a new AI feature

1. Define the schema (if structured) in `lib/ai/prompts/<feature>.ts`.
2. Write the system prompt next to the schema. Cache-friendly layout.
3. Build the call: workflow if heavy/async, inline if fast/sync.
4. Wire a rate limiter on the entry point.
5. Add a Gateway budget cap in the dashboard.
6. Smoke-test with a representative sample; baseline quality before shipping.
7. Add an integration test that hits a mocked Gateway.
