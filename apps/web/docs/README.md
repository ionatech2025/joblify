# Joblify documentation

This folder is the canonical reference for `@joblify/web`. Read these in order on day one, then keep them on hand as you build.

## Start here

1. [SETUP.md](./SETUP.md) — install Bun, link Vercel, install Marketplace integrations, run the first migration, deploy.
2. [ARCHITECTURE.md](./ARCHITECTURE.md) — how the pieces fit. Read this once; it answers "why is X where it is."
3. [REMAINING_STEPS.md](./REMAINING_STEPS.md) — everything that's NOT done yet. Cross-references every `TODO(week-N)` in code.

## By concern

| Concern | Doc |
|---|---|
| Frontend conventions (state, forms, components, a11y) | [FRONTEND.md](./FRONTEND.md) |
| Server Actions, Route Handlers, audit log, workflows | [BACKEND.md](./BACKEND.md) |
| Postgres schema, pgvector, PostGIS, migrations | [DATABASE.md](./DATABASE.md) |
| Clerk wiring, RBAC, route gating | [AUTH.md](./AUTH.md) |
| AI Gateway, prompts, workflows, cost management | [AI.md](./AI.md) |
| Algolia indexing, ranking, reranking | [SEARCH.md](./SEARCH.md) |
| Secret hygiene, gitleaks, rate limit, BotID, CSP | [SECURITY.md](./SECURITY.md) |
| GDPR/CCPA, audit log, retention | [COMPLIANCE.md](./COMPLIANCE.md) |
| Sentry, structured logger, alerts | [OBSERVABILITY.md](./OBSERVABILITY.md) |
| Vitest, Playwright, k6, axe, Lighthouse | [TESTING.md](./TESTING.md) |
| CI/CD, Vercel preview/prod, Rolling Releases | [DEPLOYMENT.md](./DEPLOYMENT.md) |

## Live runbooks

| Doc | When you read it |
|---|---|
| [OPERATIONS.md](./OPERATIONS.md) | On-call. Where things live, common plays, SLOs. |
| [CUTOVER_RUNBOOK.md](./CUTOVER_RUNBOOK.md) | Week 12 cutover. Don't ship to prod without ticking every box. |

## House rules

- **Never commit secrets.** `.env.example` has placeholders only. Real values live in Vercel Project Environment Variables. CI runs `gitleaks` on every push.
- **Server Actions are the default mutation path.** `useMutation` only when the mutation is genuinely client-side (no auth gate needed).
- **TanStack Query for server state, Zustand for client state.** Never mirror server data into Zustand.
- **AI traffic flows through AI Gateway.** Plain `'provider/model'` strings. Never import `@ai-sdk/anthropic` / `@ai-sdk/openai` directly.
- **Every state-changing controller is wrapped in `withAudit`.** No exceptions.
- **`TODO(week-N)` is a contract.** Every deferred wiring is tagged with the week it lands. Greppable.

## Reference plan

The 12-week implementation plan lives at `/home/distantlife/.claude/plans/analyse-codebase-and-close-tranquil-penguin.md`. The docs in this folder are how the plan is implemented; the plan itself is the why.
