# Backend

Server Actions, Route Handlers, audit log, workflows. Everything that runs on Fluid Compute.

## What lives where

| Surface | Use it for |
|---|---|
| **Server Components** | Read paths on Server-Component-rendered pages. Direct Prisma queries; no HTTP indirection. |
| **Server Actions** (`app/actions/*.ts`) | Mutations triggered by forms or client components. Default mutation path. |
| **Route Handlers** (`app/api/v1/*/route.ts`) | Public HTTP surface: webhooks, cron triggers, future mobile API, JSON responses. |
| **Workflows** (`workflows/*.workflow.ts`) | Multi-step or > 30 s operations. Durable, retried, idempotent. |

If you're writing a button-click POST from a Client Component → use a Server Action. If you're writing a webhook receiver → Route Handler. If the operation involves AI or file processing → Workflow.

## Server Action contract

Every Server Action follows this six-step shape:

```ts
'use server';

import { updateTag } from 'next/cache';
import { headers } from 'next/headers';
import { z } from 'zod';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { someLimit } from '@/lib/ratelimit';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';

const Input = z.object({ ... });

export async function doThing(input: z.infer<typeof Input>): Promise<R> {
  // 1. Auth
  const user = await requireRole('JOB_SEEKER');

  // 2. Rate limit
  const rl = await someLimit(user.id);
  if (!rl.success) throw new Error('rate limit');

  // 3. Validate
  const parsed = Input.parse(input);

  // 4. Tenancy / ownership
  const target = await db.thing.findFirst({ where: { id: parsed.id, userId: user.id } });
  if (!target) throw new AuthError('FORBIDDEN');

  // 5. Mutate inside withAudit
  const h = await headers();
  const ctx = { actorId: user.id, ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null, ua: h.get('user-agent') ?? null };

  const result = await withAudit(
    ctx,
    { action: 'X_HAPPENED', entity: 'thing', entityId: target.id, after: (r) => ({ id: r.id }) },
    (tx) => tx.thing.update({ where: { id: target.id }, data: { ... } }),
  );

  // 6. Invalidate
  updateTag(tags.user(user.id));
  return result;
}
```

Skipping any step is a bug. See `app/actions/apply.ts` for a complete example with BotID + email + workflow trigger.

## Route Handler patterns

### Cron

```ts
import { NextResponse } from 'next/server';

// Route handlers are dynamic by default under cacheComponents — no segment
// config needed (the legacy `export const dynamic = 'force-dynamic'` is now
// disallowed and was removed from every route).
export const maxDuration = 300;

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const summary = await runWorkflow();
  return NextResponse.json({ ok: true, at: new Date().toISOString(), ...summary });
}
```

Crons are configured in `vercel.ts`. The auth header check is enforced in every cron route — Vercel injects `CRON_SECRET` automatically on the cron-invoked request.

### Webhook

Always verify signatures with `svix`:

```ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

const headerPayload = await headers();
const svixId = headerPayload.get('svix-id');
const svixTimestamp = headerPayload.get('svix-timestamp');
const svixSignature = headerPayload.get('svix-signature');
if (!svixId || !svixTimestamp || !svixSignature) return new Response('missing svix headers', { status: 400 });

const body = await req.text();
const evt = new Webhook(secret).verify(body, { 'svix-id': svixId, 'svix-timestamp': svixTimestamp, 'svix-signature': svixSignature });
```

Clerk + Resend both use svix. Other providers — adapt accordingly; never accept an unverified webhook.

### Mobile / JSON API

`app/api/v1/*` is the stable HTTP surface. Versioned (`/v1`) so a future v2 can ship alongside without breaking mobile clients.

- Always return JSON with a stable shape.
- Auth via `currentUser()` from `lib/auth.ts`.
- Rate limit with the appropriate `*Limit` from `lib/ratelimit.ts`.
- Return `{ error: '<machine-code>' }` on failure; never leak stack traces.

## Audit log

Every mutation that touches user data writes an `AuditEvent`. The `withAudit` helper enforces this:

```ts
await withAudit(
  { actorId, ip, ua },
  {
    action: 'APPLICATION_STATUS_CHANGED',
    entity: 'job_application',
    entityId: applicationId,
    before: { status: previousStatus },
    after: (r) => ({ status: r.status }),
  },
  async (tx) => tx.jobApplication.update({ ... }),
);
```

The mutation and the audit row are written in the same transaction — if either fails, both roll back.

**Adding a new `AuditAction`**: add the enum value in `prisma/schema.prisma`, run `bunx prisma migrate dev`, then use it. Don't add free-form action strings; the enum is a forcing function for naming consistency.

## Workflows

`workflows/*.workflow.ts` are plain async functions. Each is invoked off the response path via Next's `after()` (from the apply Server Action + upload route) or directly from a Cron Route Handler (digest, retention) today; once the Vercel Workflow DevKit is enabled on the account, they become first-class durable steps with automatic retries. They're written idempotent so that upgrade is a drop-in.

Pattern:

```ts
// workflows/foo.workflow.ts
export type FooInput = { x: string };

export async function runFoo(input: FooInput): Promise<FooResult> {
  // 1. Idempotency check
  const existing = await db.foo.findUnique({ where: { id: input.x } });
  if (existing?.completedAt) return existing;

  // 2. Steps (each is itself idempotent)
  const step1 = await db.foo.update({ ... });
  const step2 = await callExternal(...);

  // 3. Final write
  return db.foo.update({ where: { id: step1.id }, data: { completedAt: new Date() } });
}
```

Idempotency is the contract. The workflow can be invoked twice (retry, manual rerun) and produce the same final state.

## Prisma client

Singleton in `lib/db.ts`. Reuse across Fluid Compute invocations to avoid connection-pool exhaustion. Do not `new PrismaClient()` anywhere else.

**Query patterns:**

- Reads in Server Components: `db.thing.findUnique(...)` directly.
- Writes anywhere: through `withAudit` so the audit row lands too.
- Raw SQL for pgvector / PostGIS: `db.$executeRaw` and `db.$queryRaw` with tagged templates (never string concatenation).
- Transactions: `db.$transaction(async (tx) => { ... })`. `withAudit` uses this internally.

**Tenancy**: every controller that takes an ID from the URL or body must check ownership:

```ts
const job = await db.jobPost.findFirst({
  where: { id: jobId, companyId: user.id, deletedAt: null },
});
if (!job) throw new AuthError('FORBIDDEN');
```

Never trust the URL. See `app/actions/update-applicant-status.ts` for the canonical example.

## Email sends

Two kinds:

- **Transactional** (apply confirm, status change, password reset): inline `await resend().emails.send(...)`. Best-effort — wrap in `.catch` so the user-facing path never fails because of email.
- **Bulk** (daily digest): batched in a workflow. One send per user.

Templates live in `lib/email/templates.ts` as functions returning `{ subject, text, html }`. Plain HTML + text for V1; upgrade to React Email components if the digest gets richer.

Hard bounces + complaints are suppressed: the Resend webhook sets `User.emailSuppressedAt`, the daily digest filters those rows out at the query level, and `isEmailSuppressed()` (from `lib/email/resend.ts`) guards transactional sends.

## File uploads

Vercel Blob with scoped client tokens. Flow:

1. Client posts `{ kind: 'resume', filename, contentType, size }` to `/api/v1/uploads/sign`.
2. Route Handler verifies session, asserts path prefix matches `resumes/<userId>/`, returns a scoped token.
3. Client uploads directly to Blob with the token.
4. Vercel calls `onUploadCompleted` with blob metadata; server writes the `Resume` row.
5. Workflow trigger: `resume-parse.workflow.ts` parses the file and writes embeddings.

Magic-byte check (`file-type` package) inside the workflow rejects mime mismatches — declared `application/pdf` but the bytes are a JPEG → soft-delete the row and abort.

## Error handling

- **Server Actions**: throw. Next propagates the error to the form's `useTransition` callback. Show user-facing text only — never expose stack traces.
- **Route Handlers**: return `NextResponse.json({ error: 'machine-code', detail: dev-only }, { status: 4xx | 5xx })`.
- **Workflows**: throw. Workflow retries handle transient errors; deterministic errors (mime mismatch, missing row) should not retry — they raise + log.
- **AuthError**: thrown by `requireUser` / `requireRole` / `requireSelfOrAdmin`. Caught at the route or layout level (which redirects to `/sign-in`).

## Logging

Use `lib/observability/logger.ts`. Never `console.log` request bodies — the logger redacts; raw console doesn't.

```ts
import { logger } from '@/lib/observability/logger';

logger.info({ applicationId, userId }, 'application submitted');
logger.warn({ err, userId }, 'email send failed (non-blocking)');
logger.error({ err, jobId }, 'reindex failed');
```

Object first, message second — pino conventions.

## Tests

- Server Actions: integration test via Vitest + a Postgres test branch (Neon's preview branching).
- Route Handlers: hit them with `request.get(...)` in Playwright; verify shape with Zod.
- Workflows: unit test the function directly with a fixture DB.

See [TESTING.md](./TESTING.md) for the full layout.
