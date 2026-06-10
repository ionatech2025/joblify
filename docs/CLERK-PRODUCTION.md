# Clerk production cutover — runbook

Move auth from the Marketplace-provisioned **development** instance
(`pk_test_…`, `*.clerk.accounts.dev`, strict usage caps, shared OAuth creds,
"development keys" console warnings) to a **production** instance
(`pk_live_…`, served from your own domain). Clerk's **free plan covers
production** (50k monthly users at $0) — the only purchase required is the
domain itself.

Steps 1–4 are dashboard/DNS work (repo owner). Steps 5–8 are repo/CLI work
(scriptable; an agent can run them once the keys exist).

---

## 0. Prerequisite: a custom domain

`pk_live` keys bind to a **verified domain you control** — you must add DNS
records, which is impossible on `*.vercel.app`. So:

```bash
vercel domains add <your-domain>        # or via the Vercel dashboard
```

Point the domain's DNS at Vercel (apex `A 76.76.21.21` / `www` CNAME
`cname.vercel-dns.com`, or delegate nameservers to Vercel). After cutover,
**auth only works on this domain** — `joblify-virid.vercel.app` keeps serving
pages but Clerk will reject it as an origin.

## 1. Create the production instance

Clerk dashboard (SSO from the CLI: `vercel integration open clerk`) →
instance switcher (top bar, currently **Development**) →
**Create production instance** → *Clone development settings* → enter the
domain.

## 2. DNS records for Clerk

The dashboard then lists the exact records — typically:

| Record | Purpose |
|---|---|
| `clerk.<domain>` CNAME | Frontend API (first-party) |
| `accounts.<domain>` CNAME | Hosted account portal / sign-in |
| `clkmail…` / `clk._domainkey…` CNAMEs | DKIM for auth emails |

Add them wherever the domain's DNS lives, then wait for the Clerk **Home**
page to show all checks green (SSL is issued automatically). Propagation is
usually minutes, can be longer.

## 3. Production OAuth credentials

Dev instances borrow Clerk's **shared** Google credentials; production
requires your own:

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth
   client ID** (Web application).
2. Authorized redirect URI: copy the exact value Clerk shows under
   **SSO connections → Google → Use custom credentials**.
3. Paste the client ID + secret back into that Clerk panel.

Skip this step if launching with email/password only. Repeat per provider
(LinkedIn etc.) when added.

## 4. Webhook on the production instance

Webhooks are **per-instance** — the dev endpoint does not carry over.
Prod instance → **Webhooks** → Add endpoint:

- URL: `https://<your-domain>/api/v1/webhooks/clerk`
- Events: `user.*` (the route mirrors users into Postgres; `lib/auth.ts`
  lazy-provisioning covers webhook lag, but the webhook stays the primary
  mirror + handles updates/deletes)

Copy the new signing secret (`whsec_…`).

## 5. Keys into Vercel — scoped per environment

From the prod instance's **API Keys** page take `pk_live_…` + `sk_live_…`.
Set them for the **Production environment only** — Preview/Development keep
the `pk_test` keys so preview deploys still auth against the dev instance.

Never paste secrets into argv or chat. Either type them at the interactive
prompt, or stage them in the gitignored `apps/web/.env.local` and pipe:

```bash
cd apps/web
vercel env rm NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production -y
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production   # paste pk_live at prompt
vercel env rm CLERK_SECRET_KEY production -y
vercel env add CLERK_SECRET_KEY production                    # paste sk_live at prompt
vercel env rm CLERK_WEBHOOK_SECRET production -y
vercel env add CLERK_WEBHOOK_SECRET production                # paste whsec at prompt
vercel env rm NEXT_PUBLIC_SITE_URL production -y
printf '%s' 'https://<your-domain>' | vercel env add NEXT_PUBLIC_SITE_URL production
```

> **Marketplace caveat:** the Clerk Marketplace resource *manages* the two
> key vars and may re-sync development values over manual overrides. If a
> redeploy reverts to `pk_test`, detach the resource's env sync from the
> project (Vercel dashboard → Integrations → Clerk resource → disconnect
> project, or `vercel integration-resource`) — the Clerk app itself is
> unaffected.

## 6. CSP allow-list

`apps/web/next.config.ts` enforces a CSP that allows the **dev** domain
(`https://*.clerk.accounts.dev`). Production serves Clerk from your own
subdomain — add `https://clerk.<your-domain>` to **`script-src`**,
**`connect-src`**, and **`frame-src`** (keep the accounts.dev entries so
preview deploys keep working). `img.clerk.com` is already allowed.

## 7. Deploy

```bash
cd apps/web && vercel deploy --prod --yes
```

Also update the Clerk-related values in any local `.env.local` if you want
local dev against prod (normally you don't — keep local on the dev instance).

## 8. Verify (all must pass)

```bash
D=https://<your-domain>
# 1. live publishable key in the served HTML (pk_live, not pk_test)
curl -s "$D/sign-in" | grep -o 'pk_live[a-zA-Z0-9_]*' | head -1
# 2. unsigned webhook → 400 svix reject (NOT 500 "secret missing")
curl -s -X POST "$D/api/v1/webhooks/clerk" -H 'content-type: application/json' -d '{}' -w ' [%{http_code}]\n'
# 3. auth gate redirects to YOUR accounts domain (not *.accounts.dev)
curl -s -o /dev/null -H 'Accept: text/html' -w '%{redirect_url}\n' "$D/dashboard"
```

In a real browser: sign up a fresh user → lands on the dashboard (no loop) →
confirm a `users` row appeared (webhook or lazy-provision) → console shows
**no** "development keys" warning and no `__clerk_test_etld` cookie errors.

## Rollback

Restore the `pk_test`/`sk_test` values for the Production env (step 5 in
reverse — the Marketplace resource still holds them), redeploy. Sessions
created on the prod instance are lost (separate user pool — see below).

## Notes

- **User pools are separate.** Dev-instance users do not migrate
  automatically. Pre-launch (demo accounts only) the clean cutover is to
  start empty; if real users ever exist on dev, use Clerk's user import
  (`POST /v1/users` via the prod secret key) first.
- The Postgres `users` table keys on `clerkUserId` — prod-instance users get
  new IDs and mirror as new rows; stale dev-mirrored rows can be pruned with
  the retention/cleanup tooling.
- After cutover, consider pointing the Vercel project's primary domain at
  `<your-domain>` everywhere user-facing (emails, sitemap, JSON-LD pick up
  `NEXT_PUBLIC_SITE_URL` automatically).
