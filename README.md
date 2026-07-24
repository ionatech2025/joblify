# Joblify — Job Portal Platform

Joblify connects job seekers with employers: profiles and resumes, job search
and applications with tracking, company job posting and applicant review, plus
AI-assisted features (resume parsing, job↔resume match scoring, bio coaching).

The production application lives in **[`apps/web`](apps/web/)** — Next.js 16
(App Router) on Vercel, with Prisma + Neon Postgres, Clerk auth, Algolia
search, Upstash Redis, Resend email, and the AI SDK via Vercel AI Gateway.

> The original Express + MongoDB backend (`Joblify-backend/`) and Vite SPA
> (`joblify-frontend/`) have been removed after the strangler-fig migration;
> they exist only in git history.

## Getting started

```bash
cd apps/web
bun install
bun run dev
```

Full setup (Vercel project, Marketplace integrations, env vars, database):
[`apps/web/docs/SETUP.md`](apps/web/docs/SETUP.md).

## Repository layout

```
joblify
├── apps/web        # the production Next.js app (see its README)
├── docs/           # repo-level runbooks (launch, security)
└── .github/        # CI: lint, typecheck, tests, gitleaks, Lighthouse
```

## Documentation

- App architecture, backend, database, auth, AI, search, testing:
  [`apps/web/docs/`](apps/web/docs/)
- Outstanding work is tracked in
  [`apps/web/docs/REMAINING_STEPS.md`](apps/web/docs/REMAINING_STEPS.md)
- Deployment targets Vercel with `apps/web` as the project root
  (config in [`apps/web/vercel.ts`](apps/web/vercel.ts))
