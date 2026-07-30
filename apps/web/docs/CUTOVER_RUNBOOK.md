# Cutover runbook — Week 12

> Source of truth: this file. Don't promise a launch date until every box below is checked.

## Pre-cutover (week 11)

- [ ] Sentry error rate < 0.5% on production preview for 7 consecutive days.
- [ ] p75 LCP on `/jobs/[slug]` < 2.0s measured via Speed Insights on Slow 4G.
- [ ] p95 API latency < 300ms for `/api/v1/jobs/search`, `/api/v1/applications`, `/api/v1/notifications`.
- [ ] k6 load test: 200 RPS sustained for 5min on `/api/v1/jobs/search` with p95 < 500ms (run from `tests/load/k6-search.js`).
- [ ] Playwright `critical-paths.spec.ts` green on Chromium + Firefox + WebKit, 7 days running.
- [ ] axe-core `a11y.spec.ts` 0 critical / 0 serious on five seed pages.
- [ ] gitleaks clean on every push for 7 days.
- [ ] Pen test report received; all critical + high findings closed.
- [ ] GDPR `/api/v1/account/export` returns signed Blob URL with full user bundle, manually verified.
- [ ] `/api/v1/cron/retention` dry-run shows expected delete counts.
- [ ] Vercel Observability shows all five cron jobs ran the last 24h.
- [ ] DNS TTL on apex lowered to 300s ≥ 48h before cutover.
- [ ] Vercel project has production domain configured.
- [ ] Rolling Releases enabled on the production deployment.

## Cutover day

1. **Final data sync**. Run `MONGO_URL=… DATABASE_URL=… bun run scripts/migrate-mongo-to-neon.ts` against a Neon production branch. Verify row counts match within 0.01%.
2. **Promote Neon branch to default** if you migrated to a side branch for the final sync.
3. **Deploy main to production** via `bunx vercel deploy --prod`. This creates the deployment but does not yet receive 100% traffic.
4. **Rolling Release 5%**: in the Vercel dashboard, set the new deployment to 5% canary. Watch Sentry + Vercel Observability for 30 min. Roll back instantly if error budget breaches.
5. **Rolling Release 25%**: after 30min clean, escalate to 25%. Watch another 30min.
6. **Rolling Release 100%**: after 60min clean at 25%, full cutover.
7. **DNS apex flip**: point your apex (e.g. `joblify.app`) to Vercel. The legacy Render frontend stops receiving traffic at TTL expiry.
8. **Decommission Render** once 100% traffic has been on Vercel for 48h.
9. **Mongo Atlas snapshot**: export final snapshot to a compliance archive (S3 / Blob), then pause the Atlas project. Don't delete for 90 days.
10. **Communicate**: send the beta invite to your launch list once steady-state.

## Rollback

If anything breaks at any rolling release stage:

1. Vercel dashboard → set the previous deployment back to 100% (one click).
2. DNS does not need to change — Vercel handles the swap.
3. Open a Sentry investigation; treat anything that triggered the rollback as P0.

## Cron sanity checks

Run from a developer machine after cutover (replace `${URL}` and `${CRON_SECRET}`):

```bash
curl -H "Authorization: Bearer ${CRON_SECRET}" "${URL}/api/v1/cron/algolia-reconcile"
curl -H "Authorization: Bearer ${CRON_SECRET}" "${URL}/api/v1/cron/digest-email"
curl -H "Authorization: Bearer ${CRON_SECRET}" "${URL}/api/v1/cron/retention"
```

Each should return `ok: true` with non-zero counts.

## On-call

For the first 7 days post-cutover, define on-call rotation in PagerDuty:

- P0: Sentry new-issue in production, or error rate > 2% over 10min.
- P1: function p95 > 1500ms over 10min, or cron failure.

The cutover succeeds when all four conditions hold for 7 consecutive days:

- Sentry error rate < 0.5%.
- p95 API latency under targets.
- All Playwright critical paths green.
- Synthetic checks green.
