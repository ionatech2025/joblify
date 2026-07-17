# Operations — quick reference

Where things live and how to operate them in production. Use this when on-call.

## Where to look

| Concern | Surface |
|---|---|
| Errors (web + functions) | Sentry → joblify-web project |
| Function logs + traces | Vercel Observability → joblify-web |
| Web vitals + RUM | Vercel Speed Insights |
| Page traffic | Vercel Analytics |
| DB metrics | Neon console → joblify project |
| Cache + rate limits | Upstash console → joblify-redis |
| Search index | Algolia dashboard → jobs / companies indexes |
| Email deliveries | Resend dashboard |
| Auth, MFA, OAuth | Clerk dashboard |
| Bot protection | Vercel BotID stats |
| AI spend + provider routing | Vercel AI Gateway |

## Crons (configured in `vercel.ts`)

| Path | Schedule (UTC) | What it does |
|---|---|---|
| `/api/v1/cron/digest-email` | `0 8 * * *` | Daily new-jobs digest via Resend |
| `/api/v1/cron/retention` | `0 2 * * *` | Hard-delete expired soft-deletes, purge old views/invites/notifications |
| `/api/v1/cron/algolia-reconcile` | `*/15 * * * *` | Re-index recently-updated jobs |

Manual trigger:
```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" "${URL}/api/v1/cron/<name>"
```

## Common runbook plays

**Search returning empty results.** Check Algolia dashboard → recent indexing operations. If empty, run reconcile cron manually. If still empty, check `algolia.ts` API key + `KV_REST_API_URL` env vars.

**Apply flow rejecting requests.** Likely BotID confidence dropped or apply rate limit hit. Check Vercel BotID logs + Upstash key `joblify:apply:*` counter for the user.

**Mass email failures.** Resend dashboard → suppression list. New domain reputation issue: pause `digest-email` cron until investigated. Don't disable transactional (apply confirmation + status change) — those are non-replayable.

**Sentry new P0 in production.** Use Vercel Rolling Releases to roll back to the previous deployment (one click). Then debug in a preview.

**DB query slow.** Neon console → metrics → slow query log. If a `pgvector` similarity query is hot, check that the HNSW index is created. If a `tsv` FTS query is slow, ensure `pg_trgm` gin index exists on `tsv`.

**Mongo legacy still receiving writes.** Should not happen post-cutover. If it does: legacy `Joblify-backend` is still deployed somewhere — confirm Render project is paused.

**Need to restore the database.** Don't improvise — follow the production restore procedure in [DATABASE.md](./DATABASE.md#backups--dr), not the quarterly drill steps (those intentionally tear the restored branch down). Target RTO is < 4h.

**Retention cron looks wrong (0 deletes for days, or a sudden spike).** Confirm it actually ran: Vercel Observability → Functions → `/api/v1/cron/retention` → check invocation history and response body counts. Manually trigger with the curl command above to see fresh counts. Cross-check against the policy table in [COMPLIANCE.md](./COMPLIANCE.md#retention-policy) — a spike usually means a backlog from a prior failed run (harmless, it'll catch up), a silence usually means the cron stopped firing (check `vercel.ts` crons config didn't get dropped in a deploy) or `CRON_SECRET` rotated without updating Vercel env.

## Secrets rotation cadence

- Clerk webhook secret: rotate on any suspicion of leak.
- `CRON_SECRET`: rotate every 90 days; update Vercel env, redeploy.
- `RESEND_API_KEY`: rotate yearly or on rotation policy.
- `ALGOLIA_ADMIN_API_KEY`: rotate yearly.
- `AI_GATEWAY_API_KEY`: rotate yearly.
- Database URL: rotate via Neon — Marketplace integration handles propagation.

## SLOs (V1)

- Availability: 99.5% monthly.
- p95 LCP (`/jobs/[slug]`) on 4G: < 2.0s.
- p95 API latency (search, applications, notifications): < 300ms.
- Sentry error rate: < 0.5% monthly average.
- Cron success rate: 100% on `retention`, 99% on others.

Below SLO → write a postmortem; we treat misses seriously.
