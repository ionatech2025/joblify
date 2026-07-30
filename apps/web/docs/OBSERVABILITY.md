# Observability

Three layers: errors (Sentry), traces + logs (Vercel Observability), and RUM (Speed Insights + Analytics).

## Sentry

`@sentry/nextjs` wired via `instrumentation.ts`. Captures errors on Node + Edge + browser runtimes.

Configuration (in `lib/observability/sentry.ts`):

```ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV ?? 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: 0.1,
  beforeSend(event) {
    // redact password / token / authorization
  },
});
```

Client-side adds Session Replay:

```ts
Sentry.replayIntegration({ maskAllText: true, blockAllMedia: true });
```

Both enabled at Week 6 once `SENTRY_DSN` is provisioned via the Marketplace integration.

### What goes to Sentry

- Uncaught errors anywhere in the app.
- Server Action throws.
- Route Handler 5xx responses.
- Workflow step failures.
- Manual `Sentry.captureException` for non-throwing concerns worth investigating.

### What's filtered out

- 4xx errors (user errors — they're not bugs).
- AuthError thrown by `requireUser` / `requireRole` (expected control flow).
- Rate-limit responses.
- Cancelled fetches.

Configure via `ignoreErrors` + `beforeSend` in `lib/observability/sentry.ts`.

### Source maps

Uploaded automatically by the Sentry Vercel integration on every deploy. `SENTRY_AUTH_TOKEN` enables this; comes from the Marketplace install.

### Alerts

Configured in the Sentry dashboard:

| Trigger                                       | Severity    |
| --------------------------------------------- | ----------- |
| New issue in production                       | P1          |
| Error rate > 2% over 10 min                   | P0          |
| Error rate > 5% over 5 min                    | P0 page-out |
| Replay containing a 500 status                | P1          |
| New regression on a previously-resolved issue | P1          |

Page-out via PagerDuty integration. Configure on-call rotation in PagerDuty during Week 11.

## Vercel Observability

Native. Captures:

- Function invocations (cold-start time, execution time, memory).
- Function logs (stdout + stderr).
- OpenTelemetry traces (when `@vercel/otel` is enabled).
- Build logs.

Read at <https://vercel.com/[team]/joblify-web/observability>.

Use it for:

- "Why is `/api/v1/jobs/search` slow today?" — function traces.
- "Did the cron run?" — function invocation list.
- "What was logged during the apply Server Action?" — function logs by request ID.

### Custom traces (V1.5)

Wrap workflow steps with OpenTelemetry spans:

```ts
import { tracer } from '@vercel/otel';

const span = tracer.startSpan('resume-parse.extract-text');
try { ... } finally { span.end(); }
```

Not in V1 — comes when Workflow DevKit is enabled.

## Structured logging (pino)

`lib/observability/logger.ts`. Use this, not `console.log`.

```ts
import { logger } from '@/lib/observability/logger';

logger.info({ applicationId, userId }, 'application submitted');
logger.warn({ err, userId }, 'email send failed (non-blocking)');
logger.error({ err, jobId }, 'reindex failed');
```

- First arg: object with context (correlation IDs, entity IDs, error).
- Second arg: human-readable message.
- Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`.

`LOG_LEVEL` env var overrides — defaults to `info` in production, `debug` in dev.

PII redaction is enforced via `redact.paths` (see [SECURITY.md](./SECURITY.md)). Adding a new sensitive field? Update the redact list.

### Request context

Plan (V1.5): correlate logs with traces via `traceparent` header propagated from middleware. Add a `withRequestContext(reqId)` child logger at the top of each handler.

For V1, logs are best-correlated by entity ID (userId, applicationId, jobId) — index those when grepping in Vercel Observability.

## RUM — Speed Insights

`@vercel/speed-insights/next` mounted in `app/layout.tsx`. Captures Web Vitals (LCP, INP, CLS, FCP, TTFB) per route from real user sessions.

Read at <https://vercel.com/[team]/joblify-web/speed-insights>.

Budgets enforced in CI via `lighthouserc.js`:

- LCP ≤ 2500ms
- INP ≤ 200ms
- CLS ≤ 0.1
- Lighthouse Perf ≥ 85, A11y ≥ 95, BP ≥ 95, SEO ≥ 95

A PR that regresses any budget fails the build.

## Analytics — Vercel Analytics

`@vercel/analytics/next` mounted in `app/layout.tsx`. Captures page views + custom events.

Use for product analytics that don't need a full Segment / Mixpanel:

```ts
import { track } from '@vercel/analytics/react';

track('apply_submitted', { jobId });
track('search_no_results', { query });
```

Track sparingly — analytics is a place to add bloat. Pick 3–5 funnel events and stick with them.

## Bot protection telemetry

BotID dashboard at <https://vercel.com/[team]/joblify-web/botid> shows challenge / pass / block rates. Investigate any sudden spike in blocks (could indicate a false-positive misconfig).

## Health checks

Synthetic check via Vercel Cron (TODO V1.5 — Week 11 onboarding):

```
*/5 * * * * → GET /api/v1/health
```

Page on three consecutive failures. Until that's wired, monitor manually post-cutover.

## AI Gateway observability

<https://vercel.com/[team]/ai-gateway> — per-feature spend, cache hit rate, provider success rate.

Tune from here:

- Cache hit rate < 50% on a feature → review prompt cache breakpoints.
- Spend trending toward cap → audit prompt size or switch model.
- Provider error rate > 1% → check failover routing.

## Alerts cheat sheet

| Symptom                           | Where to look                                         |
| --------------------------------- | ----------------------------------------------------- |
| 500s on apply                     | Sentry + Vercel Observability function logs           |
| Slow searches                     | Vercel Observability traces for `/api/v1/jobs/search` |
| Bounce-rate spike on /jobs/[slug] | Speed Insights LCP regression                         |
| AI cost runaway                   | AI Gateway dashboard                                  |
| Bot signups                       | BotID dashboard + Clerk users dashboard               |
| Email bouncing                    | Resend dashboard + Sentry warnings                    |
| DB CPU pegged                     | Neon console → metrics                                |

## SLOs (V1)

| SLO                                                   | Target                           |
| ----------------------------------------------------- | -------------------------------- |
| Availability                                          | 99.5% monthly                    |
| API p95 latency (search, applications, notifications) | < 300ms                          |
| LCP p75 on `/jobs/[slug]` (4G)                        | < 2.0s                           |
| Sentry error rate                                     | < 0.5% monthly avg               |
| Cron success rate                                     | 100% on retention, 99% on others |

Below SLO → blameless postmortem.

## Postmortem template

```
# Incident: <short title>
Date: YYYY-MM-DD
Severity: P0 / P1 / P2
Author: <name>

## Summary
<one paragraph>

## Timeline
HH:MM Z — <event>

## What broke
<root cause>

## What worked / didn't work
<detection, response, communication>

## Action items
- [ ] (owner, due date)
```

Save to `apps/web/docs/postmortems/<YYYY-MM-DD>-<slug>.md` once an incident actually happens. Postmortems are blameless — focus on systems, not people.
