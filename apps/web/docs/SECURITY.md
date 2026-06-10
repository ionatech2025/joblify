# Security

The decisions that protect the marketplace and its users. Read this end-to-end before shipping new surfaces.

## Threat model summary

Joblify is a 2-sided marketplace handling PII (resumes, contact info, application data) and identity (auth). Primary threats:

- **Credential leakage** — committed secrets, log exposure.
- **Account takeover** — credential stuffing, phishing, OAuth misuse.
- **Mass enumeration / scraping** — bots harvesting candidates or jobs.
- **Spam / abuse** — fake JDs, fake applies, content injection.
- **Authorization bypass (IDOR)** — accessing another tenant's data.
- **Supply-chain compromise** — malicious npm/Bun package.

The defenses below address each.

## Secret hygiene

| Rule | How |
|---|---|
| Real secrets never in code or `.env.example` | `.env.example` has placeholders only; CI runs `gitleaks` on every push. |
| Secrets live in Vercel Project Env | Marketplace integrations auto-inject; manual ones via `vercel env add`. |
| Local secrets pulled via CLI | `bunx vercel env pull .env.local`; `.env*` gitignored except `.env.example`. |
| Rotation cadence | Clerk webhook secret: on suspicion of leak. `CRON_SECRET`: every 90 days. API keys: yearly. |
| History scrubbing on leak | `git filter-repo --replace-text` followed by `git push --force-with-lease`. |

If you push a secret by accident: **rotate it first**, then scrub history. Order matters — the secret is recoverable from any clone until rotated.

## Authentication

Clerk owns user auth. See [AUTH.md](./AUTH.md) for full wiring. Key safeguards:

- **MFA required for `org:company` and `org:admin`** via Clerk auth-strength policy.
- **Webhook signatures verified** with svix HMAC. Forged webhooks return 400.
- **Session cookies set by Clerk** — httpOnly, SameSite=Lax, Secure in production.
- **No JWT in localStorage**. The client never sees a token; sessions are cookie-based and managed by Clerk.

## Authorization

Three-layer gate. See [AUTH.md](./AUTH.md):

1. `middleware.ts` → coarse path gates.
2. Route group layout → `requireUser` / `requireRole` second check.
3. Action / Route Handler → re-validates + asserts tenancy on every mutation.

**Tenancy is enforced in every controller**, not just the layout. See `app/actions/update-applicant-status.ts` for the canonical IDOR-safe pattern: `db.jobApplication.findFirst({ where: { id, jobPost: { companyId: user.id } } })`.

## Rate limiting

Centralized in `lib/ratelimit.ts`. Backed by Upstash Redis sliding window.

| Endpoint | Limit | Identifier |
|---|---|---|
| `/sign-up` | 3 / hour | IP |
| `/sign-in` | 10 / 15 min | IP |
| `/jobs/[id]/apply` (Server Action) | 20 / day | userId |
| `/api/v1/account/*` | 2 / day | userId |
| `/api/v1/jobs/search` | 100 / min | IP |
| Global | 600 / 15 min | IP |

When Upstash env is unset (local dev), the limiter is a no-op — production always has env via Marketplace.

Adjust limits from observability data; don't lower them speculatively.

## Bot protection

Vercel **BotID** (free) on sign-up + sign-in. **BotID Pro** on `/jobs/[id]/apply` Server Action.

The check:

```ts
import { checkBotId } from 'botid/server';

const verdict = await checkBotId();
if (verdict.isBot) throw new Error('Suspicious traffic. Please try again.');
```

Wired in `middleware.ts` for routes; called directly in `actions/apply.ts` for the apply funnel.

## Input validation

Zod everywhere. Same schema reused on client (RHF resolver) and server (Server Action parse). Reject in one place; trust upstream nowhere.

Patterns:

- `z.string().uuid()` for IDs.
- `z.string().email()` for email.
- `z.string().max(N)` always — never accept unbounded strings.
- `z.coerce.number()` for HTML number inputs.
- Enums via `z.enum([...])` typed to Prisma enums.

## SQL injection

Prisma's typed query API is safe by construction. For raw SQL (pgvector / PostGIS), **always** use the tagged-template form: `` db.$queryRaw`...${value}...` `` — never string concatenation.

The codebase only has raw SQL inside `lib/search/index-job.ts` and the AI workflows; every one uses tagged templates.

## XSS

- All JSX renders via React's escaped output — safe by default.
- `dangerouslySetInnerHTML` is used **once**, in `app/(marketing)/jobs/[slug]/page.tsx` for the JSON-LD `<script>`. The content comes from `lib/seo/job-jsonld.ts` which calls `JSON.stringify` on a typed object — no user-supplied HTML enters the script tag.
- Email HTML in `lib/email/templates.ts` runs every interpolation through an `escape()` helper. Add new variables → escape them.
- Cookie banner content is hardcoded; no user input rendered.

## CSRF

Server Actions are CSRF-safe by Next 16 design (same-origin, no GET mutations). For Route Handlers that mutate (webhooks), signature verification replaces CSRF tokens.

If you add a cross-origin POST handler, gate it with a same-site check or a verified signature.

## Security headers

In `next.config.ts` `headers()`:

| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(self)` |

No CSP yet — the Clerk widget needs flexible script sources and tuning a strict CSP across Clerk + Vercel Analytics + Speed Insights + Sentry needs a dedicated PR. Add in Week 11 hardening.

`poweredByHeader: false` removes the `X-Powered-By: Next.js` fingerprint.

## Cookies

Clerk session cookies: httpOnly + Secure + SameSite=Lax. No app-managed cookies in V1; consent state is `localStorage` (see [COMPLIANCE.md](./COMPLIANCE.md)).

## Logging — PII redaction

`lib/observability/logger.ts` redacts before serialization:

```ts
redact: {
  paths: [
    'req.body.password', 'req.body.confirmPassword', 'req.body.token',
    'req.headers.authorization', 'req.headers.cookie',
    '*.password', '*.confirmPassword', '*.token', '*.refreshToken', '*.authorization',
  ],
  censor: '[REDACTED]',
}
```

Adding a new sensitive field? Update the redact list in the same PR. CI runs `gitleaks`; runtime relies on the redact list — both layers.

## File uploads

See [BACKEND.md](./BACKEND.md) for the full pipeline. Key safeguards:

- Client uploads via a Vercel Blob token scoped to `<userType>/<userId>/` — cannot escape namespace.
- `allowedContentTypes` enforced server-side.
- `maximumSizeInBytes` enforced server-side.
- Magic-byte check in `resume-parse.workflow.ts` rejects mime spoofing.
- AV scan (Cloudmersive) is V1.5; volume is low enough at beta scale that magic-byte + Blob isolation is acceptable risk. Re-evaluate at 1k resumes/day.

## Supply chain

- `gitleaks-action@v2` in CI scans every push for committed secrets.
- Dependabot auto-PRs are configured (TODO Week 1 follow-up if not enabled).
- Lockfile (`bun.lock`) is committed; `bun install --frozen-lockfile` in CI prevents drift.
- `bun audit` (planned V1.5) runs in CI to flag known CVEs.

## Audit trail

Every state-changing op writes an `AuditEvent` via `withAudit`. See [BACKEND.md](./BACKEND.md). Audit log is immutable; readable only by admins (admin tooling deferred to V1.5 — query via Neon SQL console for now).

## Incident response

1. **Detect**: Sentry alert, oncall page, or user report.
2. **Triage**: severity per [OPERATIONS.md](./OPERATIONS.md) SLOs. P0 = secret leak, ATO, data exposure.
3. **Contain**: rotate keys, revoke sessions (Clerk dashboard → Sessions → revoke all), rolling-release-rollback if a deploy is implicated.
4. **Investigate**: AuditEvent table, Sentry traces, Vercel Observability.
5. **Communicate**: 72-hour GDPR breach window if PII exposure is confirmed.
6. **Postmortem**: blameless, what changed, action items, prevention.

## Penetration testing

External pen test booked at end of Week 9, executed Week 11. All critical + high findings must be closed before Week 12 cutover.

Annual cadence after launch, plus on any major surface change (e.g. when admin tooling lands).

## Vulnerability disclosure

Publish a `/security.txt` (TODO V1.5) listing `security@joblify.example` as the contact. Honor responsible-disclosure window (90 days).
