# Auth

Clerk is the auth provider. Postgres mirrors users. Every protected route is gated at three layers: middleware, layout, action.

## Why Clerk

- Native Vercel Marketplace integration auto-injects keys + webhooks.
- Email/password + Google + LinkedIn OAuth + TOTP MFA + passkeys out of the box.
- Organizations API was the original plan for company RBAC; V1 shipped self-serve `userType` instead (see Roles below) — nothing here provisions an Org today.
- SOC 2 Type II, SAML-ready, GDPR DPA available.

We deliberately did not roll our own. The audit burden is too high for a 1-2 person team.

## Identity model

```
Clerk users            ←→            Postgres users
─────────────                        ──────────────
  user_xxx              webhook        User.id (UUID)
                       ─────────►     User.clerkUserId = "user_xxx"  (unique)
                                      User.email
                                      User.userType   (JOB_SEEKER | COMPANY | ADMIN)
```

Two-way sync:

- **Clerk → Postgres**: webhook at `/api/v1/webhooks/clerk` handles `user.{created,updated,deleted}` + `organization.*` + `organizationMembership.created`. Idempotent upsert keyed on `clerkUserId`.
- **Postgres → Clerk** is not done. If you need to write back (e.g. update user metadata), call `clerkClient().users.updateUser(clerkUserId, { ... })` directly. Don't mirror profile data into Clerk — keep Postgres canonical.

## Route-group gating

Three layers, by intent:

### 1. Middleware (`middleware.ts`)

Coarse gate — redirects unauthenticated traffic away from protected paths before any layout renders. Signed-in-or-not only; it doesn't check role.

```ts
const isProtected = createRouteMatcher([
  '/dashboard(.*)',
  '/jobseeker(.*)',
  '/company(.*)',
  '/account(.*)',
  '/employer-setup(.*)',
  '/onboarding(.*)',
  '/admin(.*)',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) await auth.protect();
});
```

### 2. Layout (`(authenticated)/layout.tsx`)

Defense in depth — even if middleware is misconfigured, the layout refuses to render:

```ts
export default async function AuthenticatedLayout({ children }) {
  await requireUser();
  return <section>{children}</section>;
}
```

### 3. Action / Route Handler

The mutation refuses to run without auth:

```ts
const user = await requireRole('JOB_SEEKER');
```

Three layers means a single misconfiguration in any one doesn't break the gate.

## Helpers (`lib/auth.ts`)

| Helper                   | Returns        | Behavior                                                                     |
| ------------------------ | -------------- | ---------------------------------------------------------------------------- |
| `currentUser()`          | `User \| null` | The mirrored Postgres user. `null` if no Clerk session or user soft-deleted. |
| `requireUser()`          | `User`         | Like `currentUser` but redirects to `/sign-in` if no user.                   |
| `requireRole(role)`      | `User`         | `requireUser` + throws `AuthError('FORBIDDEN')` if wrong `userType`.         |
| `requireSelfOrAdmin(id)` | `User`         | `requireUser` + ensures `user.id === id \|\| user.userType === 'ADMIN'`.     |

Use these in Server Components, Server Actions, Route Handlers. Same surface, same guarantees.

## Roles

| `userType`   | Granted                                     | Maps to                                        |
| ------------ | ------------------------------------------- | ---------------------------------------------- |
| `JOB_SEEKER` | Default on signup                           | Personal dashboards, apply flow                |
| `COMPANY`    | Self-serve, on completing `/employer-setup` | Company dashboards, post-job                   |
| `ADMIN`      | Manually set in DB                          | `/admin` — verification queue, platform counts |

`userType` lives entirely in Postgres — role is _not_ driven by Clerk Organizations (nothing in this app provisions one). `requireRole('COMPANY')` / `requireRole('ADMIN')` in each route-group layout and Server Action is what actually enforces it; middleware only checks "signed in."

## Adding a company

Self-serve (current):

1. User signs up via Clerk as a jobseeker (default) and lands on `/onboarding`.
2. Picks "I'm hiring" → `/employer-setup`, fills out the company form.
3. `createCompanyProfile` (`app/actions/company.ts`) writes the `CompanyProfile` row and flips `User.userType = 'COMPANY'` in the same transaction — no webhook round-trip, no Clerk Organization involved.
4. `employer-setup-form.tsx` confirm-gates this when the account already has a `JobSeekerProfile`, since the flip is a one-way switch away from the jobseeker workspace.

The webhook's `organizationMembership.created` case (also sets `userType: COMPANY`) predates this flow and is now a dormant fallback — it only fires if something starts provisioning Clerk Organizations again, which nothing here does today.

## MFA

Not app-enforced today — this section previously described an `org:company`/`org:admin` step-up policy that depended on Clerk Organizations, which (per the Roles section above) nothing in this app provisions, so it was never actually reachable. What's real: Clerk's account-level TOTP/passkey MFA (users can turn it on for their own sign-in if enabled in the Clerk dashboard), same as the "Why Clerk" bullets above.

There's no per-action step-up (require fresh MFA inside the last N minutes) on any sensitive operation yet — payouts, bulk applicant export, account delete. If one is needed, `auth()`'s `has()` check works against Clerk permissions attached to a real role (`User.userType`-backed, not `org:*`, since we don't have Organizations) — wire it per-action when a concrete sensitive op needs it, don't reintroduce the org-role assumption.

## OAuth providers

| Provider         | Status                         | Notes                                    |
| ---------------- | ------------------------------ | ---------------------------------------- |
| Email + password | Enabled                        | Magic-link variant available             |
| Google           | Enable in Clerk dashboard      | Free; no review                          |
| LinkedIn OIDC    | Submit Day 1; review 2–4 weeks | Non-negotiable for a job board long-term |
| Apple            | Optional                       | Adds App Store reach when mobile lands   |
| GitHub           | Optional                       | Niche; helpful for dev-focused listings  |

While LinkedIn review is pending, ship with Google + email/password. Flip LinkedIn on once approved.

## Session storage

Clerk manages it. No local session store on our side; nothing to scale. The Postgres `LoginSession` model was a legacy concept and isn't used in V1 — login activity tracking goes through Clerk's session events instead.

## Webhook signing

Clerk uses `svix`. The handler at `/api/v1/webhooks/clerk` verifies HMAC; rotation is via the Clerk dashboard. If you suspect a leak, rotate the signing secret and update `CLERK_WEBHOOK_SECRET` in Vercel; the handler picks up the new secret on next deploy.

## Sign-out

Two paths:

1. **User-initiated**: Clerk's `<UserButton>` / `<SignOutButton>` UI components. Handle via Clerk.
2. **Server-initiated** (e.g. on `deleteMyAccount`): redirect to `/sign-out?reason=deleted`. We don't currently revoke server-side sessions via `clerkClient().sessions.revokeSession()` — add that to `app/actions/account.ts:deleteMyAccount` when you wire the full delete flow.

## Adding a new protected page

1. Pick the right route group: `(authenticated)` for any logged-in user, `company` for companies.
2. The layout already enforces auth — your page just calls `requireUser()` (jobseeker) or `requireRole('COMPANY')`.
3. Use `db.thing.findFirst({ where: { id, ownerId: user.id } })` for any tenancy-bounded read.

That's it. No new middleware config, no manual auth check anywhere.

## Common pitfalls

- **Don't call `auth()` from a Client Component.** Use a Server Component / Server Action / Route Handler.
- **Don't pass `User` props from server to client.** Pass a shaped DTO (e.g. `{ id, displayName }`). Forward-compat for when sensitive fields are added.
- **Don't trust `userType` from the client.** Always re-read from Postgres on the server.
- **Don't rely on middleware alone.** The layout `requireUser` is a load-bearing second check.
