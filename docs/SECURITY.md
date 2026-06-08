# Security

## Open incident — leaked legacy dev secrets in git history

**What:** the initial-import commit
[`ce376713`](https://github.com/ionatech2025/joblify/commit/ce376713a708fdc63ebe24b3300a91ba7cdb0338)
("Add frontend and backend projects") committed `Joblify-backend/.env.example`
containing real dev secrets — a **MongoDB Atlas connection string** and the
**`JWT_SECRET` / `SESSION_SECRET`** values.

**Where it is now:** only in **git history**. The current tree is placeholdered
(`DATABASE_URL="REPLACE_ME"`, etc.), so no live secret ships in `HEAD`. The
commit is reachable from `main` (and therefore from every branch/PR that
descends from it).

**CI:** `gitleaks` flagged this finding. It is allowlisted by commit SHA in
[`.gitleaks.toml`](../.gitleaks.toml) so CI is unblocked on the *known* finding
while all other detectors stay active. **The allowlist does not rotate the
secret.**

### REQUIRED — rotate the credentials (only the repo owner can do this)

These live outside the repo; an allowlist or a history rewrite does **not**
invalidate them. Do this first, regardless of whether you scrub history:

1. **MongoDB Atlas** — in the Atlas dashboard, rotate (or delete + recreate) the
   database user in the leaked connection string, and update the new value in
   the runtime secret store (Vercel project env / wherever the legacy API
   reads `DATABASE_URL`). Confirm the old credentials no longer authenticate.
2. **JWT / session** — generate fresh `JWT_SECRET` and `SESSION_SECRET` values
   (`openssl rand -base64 48`) and update them in the runtime env. Rotating
   these invalidates any tokens signed with the old secret (expected).

Until step 1 completes, the leaked Atlas credential remains usable by anyone who
has the historical commit.

### OPTIONAL — scrub the value from history

Once rotated, the dead secret in history is harmless, and rewriting a shared
default branch is itself risky (it changes every commit SHA from `ce37671`
forward, breaks all existing clones, and forces every open branch/PR — incl.
`feature/enhanced-navbar-landing-page`, `fix-profile-api`, PR #19 — to be
rebased or recreated). Only do this if policy requires it, and coordinate so
everyone re-clones afterward.

```bash
# Requires: pip install git-filter-repo  (or: brew install git-filter-repo)
# Work on a fresh mirror clone — filter-repo refuses to run on a normal checkout.
git clone --mirror git@github.com:ionatech2025/joblify.git joblify-scrub
cd joblify-scrub

# Redact the secret values across all of history (keeps the file, blanks the value).
cat > redactions.txt <<'EOF'
regex:mongodb\+srv://[^"'[:space:]]+==>REDACTED-rotated-see-SECURITY.md
regex:(JWT_SECRET|SESSION_SECRET)=.*==>\1=REDACTED-rotated
EOF
git filter-repo --replace-text redactions.txt

# Force-push the rewritten history. DESTRUCTIVE — coordinate first.
git push --force --all
git push --force --tags
```

After a force-push: everyone deletes their clone and re-clones; open PRs are
recreated against the rewritten `main`; the `gitleaks` allowlist entry for
`ce37671` can then be removed (the SHA no longer exists).

## Routine practices

- `gitleaks` runs on every push (CI). New findings fail the build.
- Secrets live in Vercel project env / the runtime store — never in the repo.
  `.env*` (except `*.env.example` with placeholders) is gitignored.
- Server logs redact `password` / `token` / `authorization` (pino + Sentry
  `beforeSend`).
