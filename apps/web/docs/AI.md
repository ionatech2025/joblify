# AI

All model traffic flows through Vercel AI Gateway. Plain `'provider/model'` strings. Per-feature spend caps, automatic provider failover, optional zero-data-retention routing, unified observability.

## Gateway is the only entrypoint

```ts
// lib/ai/gateway.ts
import { createGateway } from 'ai'; // `ai` bundles the gateway; no separate @ai-sdk/gateway
export const gateway = createGateway({ apiKey: process.env.AI_GATEWAY_API_KEY });
```

Never import `@ai-sdk/anthropic`, `@ai-sdk/openai`, or any other provider SDK directly. The gateway gives us:

- Per-feature budget caps in the Vercel dashboard.
- Provider failover (Anthropic primary → OpenAI fallback) without code changes.
- One bill, one place to audit usage.
- Optional zero-data-retention routing (`AI_GATEWAY_ZDR=1`, a Pro/Enterprise Gateway feature — it fails the request closed if no ZDR provider is available, so enable it only on a plan that has it).
- Cache breakpoint observability.

## Models we use

| Alias       | Default model string            | Override env         | Where                                                |
| ----------- | ------------------------------- | -------------------- | ---------------------------------------------------- |
| `haiku`     | `anthropic/claude-haiku-5.5`    | `AI_MODEL_FAST`      | Cheap structured extraction: resume parse, JD skills |
| `sonnet`    | `anthropic/claude-sonnet-5.5`   | `AI_MODEL_SMART`     | Assistant features: bio coach                        |
| `embedding` | `openai/text-embedding-3-small` | `AI_MODEL_EMBEDDING` | 1536-dim embeddings for match score                  |

Aliases live in `lib/ai/gateway.ts` `MODELS`.

**Slugs are the Gateway's canonical ids, not the provider's.** The Gateway catalogue
(`GET https://ai-gateway.vercel.sh/v1/models`) spells Claude models with dots —
`anthropic/claude-haiku-5.5` — where Anthropic's own API uses dashes. The dashed ids this file
previously listed (`claude-haiku-4-5`, `claude-sonnet-4-6`) are not in the catalogue, so every call
was rejected and the callers' broad `catch` silently fell back to the heuristic parser. Verify any
new slug against the live catalogue before changing a default.

**The embedding model must return 1536 dimensions** — the `resumes.embedding` and
`job_posts.embedding` columns are `vector(1536)`. `text-embedding-3-large` returns **3072** by
default, which pgvector rejects; the previous code never passed `dimensions`, never checked the
width, and swallowed the resulting error as "model unavailable". `lib/ai/embeddings.ts` now asks
for `dimensions: 1536`, **validates the returned width at the call**
(`EmbeddingShapeError`), and records the producing model in `embeddingModel`. Changing the model
means vectors from the old one are no longer comparable: rows whose `embeddingModel` differs are
re-embedded by the reconcile sweep, and `runMatchScore` refuses to compare across models.

## V1 features

### 1. Resume parse (workflow)

`workflows/resume-parse.workflow.ts`. Triggered by the apply Server Action after a fresh resume upload; the algolia-reconcile cron's sweep re-runs resumes stranded half-processed (`parsedJson`/`embedding` NULL), capped at 5 attempts per resume.

- Input: a `Resume` row whose `fileBlobUrl` is a locator into the **private** Blob store.
- Steps: read **through the store SDK** (never `fetch(url)`) → `file-type` magic-byte check (PDF / .docx only) → budgeted text extraction (`lib/resume/extract-text.ts`: `unpdf` for PDF, `fflate` + a linear scan for .docx; limits on bytes, pages, decompressed size, entries, output, wall clock) → `generateObject` with `ResumeSchema` via Haiku, the résumé fenced as untrusted data → write `parsedJson` (tagged `_source: 'model' | 'heuristic'`) → link catalogue skills → embed + write `embedding`/`embeddingModel`.
- Failure handling: a hostile/corrupt/oversized file is a _permanent_ failure (`parseFailedAt` set at once, never retried); a model outage falls back to the heuristic parser and the sweep re-parses it with the model later; an embedding failure **propagates** (the parse is already saved) instead of being swallowed.
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

- Input: `{ jobPostId, jobSeekerId, resumeId? }` — pass the résumé that was submitted so the score describes the document the employer actually received.
- Steps:
  1. Look up the résumé embedding (the submitted one, else the latest non-deleted) and its `embeddingModel`.
  2. Look up the JD embedding; compute + persist if missing **or from a different model**.
  3. Skip (return `null`) unless both vectors come from the current model.
  4. Cosine similarity in code.
  5. Write `JobApplication.matchScore` + `matchModel` + `matchScoredAt`.
- Output: a 0–1 score. It is an uncalibrated similarity, not a probability or a decision.
- Cost: ~$0.0001 per JD embed (one-shot); cosine compute is free.

Hot read path on `/jobs/[slug]` (authenticated jobseeker): inline SQL `1 - (r.embedding <=> j.embedding)` — no Gateway call.

### 4. Bio coach (streaming chat)

`api/v1/ai/bio-coach/route.ts`. Powered by `ai`'s `streamText` + `@ai-sdk/react`'s `useChat` on the client.

- Input: chat messages (only `user`/`assistant` text parts are accepted; client-supplied `system` turns are refused; last 12 turns kept, each capped at 4 000 chars, body capped at 64 KB) plus the user's current bio, which is fenced as untrusted data rather than concatenated into the system role.
- Model: Sonnet via Gateway, temperature 0.4, maxOutputTokens 600.
- Output: streamed text via UI Message Stream.
- Cost: ~$0.005 per turn.

Rate-limited per user by `bioCoachLimit` (30/hour). The limiter never fails open: with Redis absent or erroring it enforces the same limit in-process.

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

- **PII**: résumé content is the value, so it is sent unredacted. Retention is controlled by routing: set `AI_GATEWAY_ZDR=1` to restrict requests to zero-data-retention providers (needs a plan that offers it). Do not claim ZDR in any user-facing text unless that is on — `/legal/ai` keys its wording on the variable.
- **Prompt injection** (OWASP LLM01): résumé, job-description and bio text are untrusted. They are sanitised (zero-width / bidi / control characters stripped), **fenced** in a tag the system prompt declares to be data (`lib/ai/untrusted.ts`), and any closing tag inside the payload is neutralised. Outputs are schema-constrained, the embedding text is built from several structured fields rather than one free-text summary, and nothing a model returns is executed or auto-trusted: skills it proposes are matched against the catalogue and are editable by the user. When a tool-using agent ships, sandbox tool calls — never give the model a tool that hits a privileged endpoint without a server-side ownership check.
- **Hallucination**: `generateObject` constrains output shape but not content. The resume parser explicitly instructs "Never invent facts."
- **Cost runaway**: per-feature Gateway caps + per-user rate limits in `lib/ratelimit.ts`, plus input-size caps on every AI entry point.
- **Fairness / automated decisions**: see `docs/COMPLIANCE.md` ("Automated processing in hiring"). The score must not be the sole basis for any decision, and no code path acts on it automatically.

## Adding a new AI feature

1. Define the schema (if structured) in `lib/ai/prompts/<feature>.ts`.
2. Write the system prompt next to the schema. Cache-friendly layout.
3. Build the call: workflow if heavy/async, inline if fast/sync.
4. Wire a rate limiter on the entry point.
5. Add a Gateway budget cap in the dashboard.
6. Smoke-test with a representative sample; baseline quality before shipping.
7. Add an integration test that hits a mocked Gateway.
