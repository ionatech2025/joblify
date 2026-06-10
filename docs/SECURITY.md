# Security

## gitleaks CI finding — format-valid dummy auth keys (resolved)

The `gitleaks` CI job (which scans the PR's commit range) flagged the **dummy
auth keys** used to build without provisioned services, in
`.github/workflows/ci.yml` and `apps/web/docs/DEPLOYMENT.md`:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Y2xlcmsuZXhhbXBsZS5jb20k` — a
  **publishable** (public-by-design) Clerk key; it must be base64-decodable
  because the build prerenders `<ClerkProvider>`, so it can't be a bare
  placeholder. gitleaks flags it by entropy (`generic-api-key`).
- `CLERK_SECRET_KEY=sk_test_placeholderplaceholderplaceholder` — a literal
  placeholder; the `sk_test_` prefix also matches gitleaks' Stripe rule.

Neither is a real credential. They are allowlisted **by value** in
[`.gitleaks.toml`](../.gitleaks.toml) (the default ruleset stays extended, so
every other detector is still active).

## Historical leaked dev credentials in git history (rotation required)

Separately — and **not** what the PR CI scan flags — the initial-import commit
[`ce376713`](https://github.com/ionatech2025/joblify/commit/ce376713a708fdc63ebe24b3300a91ba7cdb0338)
committed `Joblify-backend/.env.example` with what appear to be **real legacy
dev secrets**: a MongoDB Atlas connection string and `JWT_SECRET` /
`SESSION_SECRET` values. HEAD is placeholdered (`DATABASE_URL="REPLACE_ME"`), so
no live secret ships today, but the value survives in history (reachable from
`main`).

### REQUIRED — rotate the credentials (only the repo owner can do this)

These live outside the repo; neither an allowlist nor a history rewrite
invalidates them. Do this regardless of whether you scrub history:

1. **MongoDB Atlas** — rotate (or delete + recreate) the database user in the
   leaked connection string, and update the new value wherever the legacy API
   reads `DATABASE_URL`. Confirm the old credentials no longer authenticate.
2. **JWT / session** — generate fresh `JWT_SECRET` / `SESSION_SECRET`
   (`openssl rand -base64 48`) and update the runtime env. This invalidates
   tokens signed with the old secret (expected).

### OPTIONAL — scrub the value from history

Once rotated, the dead secret in history is harmless, and rewriting a shared
default branch is itself risky: it changes every commit SHA from `ce37671`
forward, breaks all existing clones, and forces every open branch/PR (incl.
`feature/enhanced-navbar-landing-page`, `fix-profile-api`, PR #19) to be rebased
or recreated. Only do this if policy requires it, and coordinate a re-clone.

```bash
# Requires: pip install git-filter-repo  (or: brew install git-filter-repo)
git clone --mirror git@github.com:ionatech2025/joblify.git joblify-scrub
cd joblify-scrub
cat > redactions.txt <<'EOF'
regex:mongodb\+srv://[^"'[:space:]]+==>REDACTED-rotated-see-SECURITY.md
regex:(JWT_SECRET|SESSION_SECRET)=.*==>\1=REDACTED-rotated
EOF
git filter-repo --replace-text redactions.txt
git push --force --all && git push --force --tags   # DESTRUCTIVE — coordinate first
```

After a force-push, everyone re-clones and open PRs are recreated; the
`ce37671` allowlist entry can then be removed (the SHA no longer exists).

## Routine practices

- `gitleaks` runs on every push (CI); new findings fail the build.
- Secrets live in the Vercel project env / runtime store, never in the repo.
  `.env*` (except `*.env.example` placeholders) is gitignored.
- Server logs redact `password` / `token` / `authorization` (pino + Sentry
  `beforeSend`).
