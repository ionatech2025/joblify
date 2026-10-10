# Security

The decisions that protect the marketplace and its users. Read this end-to-end before shipping new surfaces.
Each statement names the file that enforces it — if you change the behaviour, change the sentence.

## Threat model summary

Joblify is a 2-sided marketplace handling PII (résumés, contact info, application data) and identity (auth). Primary threats:

- **Credential leakage** — committed secrets, log exposure.
- **Account takeover** — credential stuffing, phishing, OAuth misuse.
- **Mass enumeration / scraping** — bots harvesting candidates or jobs.
- **Spam / abuse** — fake JDs, fake applies, content injection, scam links in chat.
- **Authorization bypass (IDOR)** — accessing another tenant's data.
- **Hostile uploads** — files written to attack the parser, or the recruiter who opens them.
- **Server-side request forgery** — any code path that fetches a URL a user supplied.
- **Prompt injection** — résumé / job text that tries to instruct the model.
- **Supply-chain compromise** — malicious npm/Bun package or CI action.

## Secret hygiene

| Rule                                         | How                                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Real secrets never in code or `.env.example` | `.env.example` has placeholders only; CI runs `gitleaks` on every push.                     |
| Secrets live in Vercel Project Env           | Marketplace integrations auto-inject; manual ones via `vercel env add`.                     |
| Local secrets pulled via CLI                 | `bunx vercel env pull .env.local`; `.env*` gitignored except `.env.example`.                |
| Rotation cadence                             | Clerk webhook secret: on suspicion of leak. `CRON_SECRET`: every 90 days. API keys: yearly. |
| History scrubbing on leak                    | `git filter-repo --replace-text` followed by `git push --force-with-lease`.                 |

If you push a secret by accident: **rotate it first**, then scrub history. Order matters — the secret is recoverable from any clone until rotated.

## Authentication

Clerk owns user auth. See [AUTH.md](./AUTH.md). Key safeguards:

- **Webhook signatures verified** with svix HMAC over the raw body. Forged webhooks return 400.
- **Session cookies set by Clerk** — httpOnly, SameSite=Lax, Secure in production.
- **No JWT in localStorage**. The client never sees a token.
- **Roles are not derived from Clerk organizations.** `organizationMembership.created` is logged and
  ignored (`app/api/v1/webhooks/clerk/route.ts`); it used to set `userType = COMPANY`, which — with
  Organizations enabled — let anyone mint a COMPANY account. Becoming a company is
  `createCompanyProfile` + admin verification, nothing else.
- MFA / Clerk organizations for company accounts are **not** implemented (an earlier version of this
  doc claimed MFA; nothing enforced it). Company seats and SSO are a roadmap item.

## Authorization

Three-layer gate. See [AUTH.md](./AUTH.md):

1. `proxy.ts` (the Next 16 name for middleware) → coarse path gates (`auth.protect()`).
2. Route group layout → `requireUser` / `requireRole` second check.
3. Action / Route Handler → re-validates + asserts tenancy on every mutation.

**Tenancy is enforced in every controller**, not just the layout — see
`app/actions/update-applicant-status.ts`: `db.jobApplication.findFirst({ where: { id, jobPost: { companyId: user.id } } })`.

**Verification gates fail closed.** Posting or publishing a job and applying to one require a company
profile that exists _and_ is `VERIFIED` (`app/actions/post-job.ts` `verificationBlock`,
`app/actions/apply.ts`). "No profile row" is "not verified".

**Application status** is recruiter-controlled except `WITHDRAWN`, which belongs to the candidate
(`lib/applications/transitions.ts`): a recruiter can neither set it nor reopen a withdrawn
application.

**Résumés are readable only through `GET /api/v1/resumes/[id]/file`** — the owner, or a company with
a live (non-withdrawn) application that used that résumé. Anyone else gets 404. The response is
always `Content-Disposition: attachment` with `nosniff` and a `sandbox` CSP, never rendered inline
in our origin.

## Rate limiting

Centralized in `lib/ratelimit.ts`. Shared sliding window in Upstash Redis, with an **in-process
fallback** (`lib/ratelimit-memory.ts`) whenever Redis is not configured or errors. The limiter is
never "off": it used to return `allowAll` in both cases, so a deploy missing its Redis variables had
no ceiling on applications, posts, invitations, chat or paid AI calls. Per-instance counters are
weaker than a shared one (N warm instances admit up to N× the limit) but are a hard ceiling per
instance, and a limiter fault still never 500s a route.

| Limiter               | Limit       | Identifier |
| --------------------- | ----------- | ---------- |
| `applyLimit`          | 20 / day    | userId     |
| `postJobLimit`        | 10 / day    | userId     |
| `inviteLimit`         | 30 / day    | userId     |
| `chatMessageLimit`    | 60 / 10 min | userId     |
| `bioCoachLimit`       | 30 / hour   | userId     |
| `uploadSignLimit`     | 40 / hour   | userId     |
| `resumeDownloadLimit` | 120 / hour  | userId     |
| `accountExportLimit`  | 2 / day     | userId     |
| `searchLimit`         | 100 / min   | IP         |
| `viewBeaconLimit`     | 120 / hour  | IP         |
| `unsubscribeLimit`    | 30 / hour   | IP         |

Sign-in/sign-up are Clerk-hosted and throttled by Clerk. Adjust limits from observability data.

## Bot protection

Vercel **BotID** on the apply Server Action (`app/actions/apply.ts` + `instrumentation-client.ts`
`initBotId` + `withBotId()` in `next.config.ts` — all three are required for a verdict to mean
anything).

## Input validation

Zod everywhere. Same schema reused on client (RHF resolver) and server (Server Action parse).

- `z.string().uuid()` for IDs; `z.string().max(N)` always; enums via `z.enum([...])`.
- Expected failures are **returned** (`ActionResult`), not thrown — React redacts thrown messages in
  production. Server actions use `safeParse`.
- `attachmentUrl` in chat must be `https:` with no embedded credentials.
- Request bodies on AI routes have schemas, role allow-lists, turn and size caps
  (`app/api/v1/ai/bio-coach/route.ts`).

## SQL injection

Prisma's typed query API is safe by construction. For raw SQL (pgvector / PostGIS), **always** use the
tagged-template form: `` db.$queryRaw`...${value}...` `` — never string concatenation.

## SSRF and untrusted URLs

The server never fetches a URL it was handed.

- A résumé/logo URL from a client is only ever a _name_: `verifyStoredBlob` (`lib/storage/blob.ts`)
  pins the **host** to our own store (`<storeId>.<private|public>.blob.vercel-storage.com`, https only,
  no credentials/port), pins the path prefix to the caller's own namespace, and confirms existence
  through the store's API with our credentials. What gets persisted is the store's answer — URL,
  content type and size — not the request's.
- Reads go through the SDK (`get`) by pathname — never `fetch(row.fileBlobUrl)`.
- Company logo URLs typed into the profile form are ignored unless they are already in our public
  store (`trustedLogoUrl`); previously any URL reached JSON-LD, the search index and the OG renderer.
- `data:` locators exist only for local development and are refused in production.

## XSS

- JSX output is escaped by React.
- `dangerouslySetInnerHTML` is used for the JSON-LD `<script>` (`jobs/[slug]/page.tsx`) and the theme
  bootstrap. JSON-LD goes through `safeJsonLd` (`lib/seo/json-ld.ts`), which escapes `<`, `>`, `&` and
  the JS line separators — `JSON.stringify` alone does not, and an employer-authored description of
  `</script><script>…` would break out of the element.
- Email HTML in `lib/email/templates.ts` and the digest escapes every interpolation.
- Chat attachment links render with `rel="noopener noreferrer nofollow ugc"` and show their host.

## CSRF

Server Actions are CSRF-safe by Next design (same-origin, no GET mutations). Webhooks use signature
verification. The unsubscribe endpoint's **GET never mutates** (link scanners GET every URL);
only POST opts out, authenticated by a signed token that can only switch consent _off_.

## Security headers

`next.config.ts` `headers()`: HSTS (preload), `X-Frame-Options: DENY`, `nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, and an enforced
`Content-Security-Policy`:

- `'unsafe-eval'` is **development only**. Production keeps `'unsafe-inline'` for script because a
  per-request nonce is incompatible with `cacheComponents` (nonces are request data and opt every
  route out of prerendering). The exit path is hashes/SRI, tracked in REMAINING_STEPS; until then a
  strict policy ships as `Content-Security-Policy-Report-Only` and reports to Sentry.
- `img-src` lists the same hosts as `images.remotePatterns`.

`poweredByHeader: false` removes the `X-Powered-By` fingerprint.

`/api/v1/health` returns only `{ status }` to anonymous callers; the dependency map, region and
commit are for `Authorization: Bearer $HEALTH_TOKEN` (an unauthenticated report used to advertise
`redis: not_configured` — i.e. "rate limiting is off" — to the internet).

## Cookies

Clerk session cookies: httpOnly + Secure + SameSite=Lax. App-managed: `joblify_consent` (banner
choice). See [COMPLIANCE.md](./COMPLIANCE.md).

## Logging — PII redaction

`lib/observability/logger.ts` redacts passwords/tokens/authorization/cookies before serialization.
Adding a new sensitive field? Update the redact list in the same PR. Do not log storage URLs of
private objects (log the pathname).

## Trust & safety

Any signed-in user can report a posting (`app/actions/report-job.ts`: rate-limited, one report per
reporter per job, not your own job). Admins resolve the queue on `/admin`
(`resolveJobReport`): _remove_ archives the posting immediately, notifies the company, de-indexes it
and closes every open report on it; _dismiss_ closes just that report. Company verification gates who
can post; reports are the control for a verified account that goes bad.

## File uploads

- Résumés go to a **private** Blob store; logos to a separate **public** one
  (`lib/storage/blob.ts`). Résumés and exports used to be written with `access: 'public'` — a
  permanent, unauthenticated, un-revocable URL for each candidate's documents.
- Browser uploads (`/api/v1/uploads/sign`) get a token scoped to `resumes/<userId>/`, restricted
  content types, a size cap, and `addRandomSuffix`.
- **Magic-byte check** (`file-type`) before parsing; **only PDF and .docx** (legacy `.doc` has no
  maintained reader and used to be accepted, then silently soft-deleted after parsing failed).
- **Parsing is budgeted** (`lib/resume/extract-text.ts`): input bytes, PDF page count, decompressed
  DOCX size (declared size is checked before inflating), zip entry count, output characters, and a
  wall-clock deadline. A file over budget is rejected, not "best-effort parsed". PDF is read by
  `unpdf` (current PDF.js); DOCX by `fflate` + a linear scan — no general XML DOM.
- Per-account résumé quota (10).
- An AV scan (Cloudmersive/ClamAV) is **still not integrated**. Mitigations: files are served only as
  attachments with `nosniff`, never inline; recruiters get them through the authenticated route.
  Revisit at 1k résumés/day, or earlier for enterprise customers.
- **Deletion removes the file**, not just the row (`deleteResume`, retention sweep).

## Supply chain

- **GitHub Actions are pinned to full commit SHAs** (with a version comment); `permissions:
contents: read` by default; secrets and event data reach scripts through `env`, never `${{ }}`
  interpolation into shell. `bunx vercel@<pinned>` runs with the deploy token.
- `bun.lock` is committed; CI and Vercel install `--frozen-lockfile`; Bun is pinned
  (`packageManager`, `setup-bun`). `bunfig.toml` sets `minimumReleaseAge` (3 days).
- **`bun audit --prod --audit-level=high` is a blocking CI step**; two acknowledged, unfixable
  build-time advisories are listed in `ci.yml` with their reasons.
- **Dependabot** (`.github/dependabot.yml`): weekly, `bun` ecosystem, cooldown, majors alone.
- `gitleaks` runs on every push.
- Parsers for untrusted files were chosen for current maintenance and small surface
  (see File uploads); `pdf-parse@1` (2019) and `mammoth`→`@xmldom/xmldom` were removed.

## Audit trail

Every state-changing op writes an `AuditEvent` via `withAudit`, in the same transaction. IP/UA are
removed after 90 days, events after 1 year (`workflows/retention.workflow.ts`). Readable via the
admin console or the Neon SQL console.

## Incident response

1. **Detect**: Sentry alert, oncall page, or user report.
2. **Triage**: severity per [OPERATIONS.md](./OPERATIONS.md) SLOs. P0 = secret leak, ATO, data exposure.
3. **Contain**: rotate keys, revoke sessions (Clerk dashboard → Sessions → revoke all), roll back a deploy if implicated.
4. **Investigate**: AuditEvent table, Sentry traces, Vercel Observability.
5. **Communicate**: 72-hour GDPR breach window if PII exposure is confirmed.
6. **Postmortem**: blameless, what changed, action items, prevention.

## Penetration testing

External pen test before launch; all critical + high findings closed before cutover. Annual cadence
after launch, and on any major surface change (admin tooling, company seats, new upload types).

## Vulnerability disclosure

Publish `/.well-known/security.txt` with a monitored contact (TODO — needs a real address; do not
ship a placeholder). Honor a 90-day responsible-disclosure window.
