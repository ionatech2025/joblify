# Compliance

GDPR (EU) + CCPA (California) are the floors. Joblify aims for both from day one.

## Legal basis (GDPR Article 6)

| Processing activity | Basis |
|---|---|
| Operating accounts + applications | Contract |
| Anti-fraud / abuse logs | Legitimate interest |
| Email notifications | Consent |
| Analytics (Speed Insights / Analytics) | Consent |
| Audit log | Legal obligation (also legit interest) |

## Subject rights

### Article 15 — Right to access

Self-service export at **`/account/export`**. The endpoint:

1. Verifies session.
2. Rate-limited to 2/day per user (`accountExportLimit`).
3. Calls `runGdprExport({ userId })` workflow.
4. Workflow collects every row owned by the user (User, JobSeekerProfile, CompanyProfile, JobPost, JobApplication, Resume, Notification, Invitation, AuditEvent where actorId=user), bundles to JSON, uploads to Vercel Blob with random suffix, returns the public URL.
5. Workflow emails the user the link (24-hour expiry on Blob URL).
6. `AuditEvent: USER_EXPORTED` written.

SLA: < 30 days per GDPR; ours runs in seconds.

### Article 17 — Right to erasure

Self-service delete at **`/account/delete`**. Requires the user to retype their email as confirmation. The Server Action `deleteMyAccount`:

1. Soft-deletes the User row (`deletedAt` = now).
2. Writes `AuditEvent: USER_DELETED`.
3. Redirects to `/sign-out?reason=deleted`.

The `retention` workflow (daily 02:00 UTC) hard-deletes soft-deleted users after 30 days. Cascade deletes via FK rules remove:

- `JobSeekerProfile` / `CompanyProfile`
- `Resume`
- `JobApplication`
- `Notification`
- `LoginSession`
- Other dependents

What's retained after hard delete:

- `AuditEvent` rows with `actorId` set to `NULL` (FK `onDelete: SetNull`) — anonymized, kept 1 year for anti-fraud.
- `ChatMessage` (when chat ships in V1.5) — userId nulled; preserves the thread for the other party.

What we do **not** do on delete: revoke Clerk sessions (TODO Week 10 follow-up) and deindex from Algolia (TODO).

### Article 16 — Right to rectification

Self-service via `/jobseeker/profile`. Saving the form rewrites the canonical row; Clerk webhooks keep the mirror in sync for the fields Clerk owns.

### Article 21 — Right to object

Implicit via `/account/delete` and via cookie consent rejection. Email opt-out via the unsubscribe link on the daily digest (TODO Week 9 follow-up).

## Audit log

`AuditEvent` is the compliance trail. See [BACKEND.md](./BACKEND.md) for the write contract. Retention:

- 1 year by default.
- `retention` workflow purges older rows nightly.
- Cannot be deleted by users (the `actorId` is nulled on user deletion but the row stays).

## Data processors

`/legal/processors` lists every third party that processes data on our behalf:

| Processor | Purpose | Region |
|---|---|---|
| Vercel | Hosting + edge + Blob storage | EU + US |
| Neon | Postgres database | EU |
| Upstash | Redis | EU |
| Clerk | Auth | EU + US |
| Algolia | Search | EU + US |
| Resend | Transactional email | EU + US |
| Sentry | Errors + traces | EU + US |
| OpenAI + Anthropic (via Vercel AI Gateway) | AI features | US (ZDR contracts) |

Each is bound by a DPA. Add new processors to the list **and** sign a DPA before integrating.

## Data residency

EU data is processed in EU regions:

- Vercel functions: `regions: ['fra1', 'dub1', 'iad1']` in `vercel.ts`. EU-routed traffic stays in EU functions where possible.
- Neon project provisioned in `eu-central-1`.
- Algolia primary index in EU (Frankfurt); US replica for performance.
- Clerk runs multi-region with EU residency available on higher tiers — enable when the team is on the relevant plan.

AI Gateway forwards to providers in US — disclosed in `/legal/processors` and gated behind a ZDR contract (no training data).

## Retention policy

| Data | Active | Deleted | Reason |
|---|---|---|---|
| User account | until deleted | 30 d soft → hard | GDPR Art. 17 + abuse recovery window |
| AuditEvent | 1 year | purged by retention workflow | legal / anti-fraud |
| JobView | 13 months | purged | analytics window |
| Notification | read >6 mo or unread >90 d | purged | UX, not strictly required |
| Invitation | 90 d after expiry | purged | cleanup |
| LoginSession | 365 d | purged | session log retention |

Defined in `workflows/retention.workflow.ts`. Run daily; idempotent.

## Cookie consent

Self-hosted slim banner in `app/components/cookie-banner.tsx`. Three categories:

- **Necessary** — always on (session, CSRF). No consent required (GDPR strictly necessary exception).
- **Analytics** — Vercel Speed Insights + Analytics. Gated by consent.
- **Marketing** — not in V1.

Choice persisted to `localStorage` key `joblify.consent`. Server-side mirror via `/api/v1/consent` (TODO Week 10 follow-up).

The Speed Insights + Analytics scripts in `app/layout.tsx` mount unconditionally today; gate by consent before EU launch:

```tsx
{consent.analytics && <Analytics />}
{consent.analytics && <SpeedInsights />}
```

## Accessibility

WCAG 2.2 Level AA target. Statement at `/accessibility`. Automated checks in CI via `@axe-core/playwright`. Manual SR test on critical funnels per [TESTING.md](./TESTING.md).

The statement page documents:
- Target conformance level.
- Last automated check (build date implicitly).
- Contact email for accessibility issues.

## Breach response

GDPR Article 33: notify the supervisory authority within 72 hours of becoming aware. Article 34: notify affected users without undue delay if high risk.

Process:

1. Detect (Sentry, audit log, or report).
2. Contain (key rotation, session revoke, deploy rollback).
3. Assess scope (which rows / which users affected).
4. Notify DPO / legal counsel.
5. Within 72 h: file with supervisory authority if PII exposure is confirmed.
6. Notify users if high risk to rights and freedoms.
7. Postmortem + remediation + retest.

DPO: `privacy@joblify.example`. Legal: `legal@joblify.example`.

## SOC 2 readiness

Not in V1 scope, but built with SOC 2 Type 1 in mind:

- Audit log → CC7.2 (system operations).
- Access reviews via Clerk → CC6.1 / 6.2.
- Change management via GitHub PR + CI gates → CC8.1.
- Vendor management via the processors list → CC9.2.

When the team is ready for SOC 2, the gaps to fill are documented policies (vendor management, business continuity, info security) + an annual independent audit. Code-side, we're already on the right side of most controls.

## CCPA specifics

For California residents:

- Right to know: covered by `/account/export`.
- Right to delete: covered by `/account/delete`.
- Right to opt out of sale: we don't sell data; banner state of `analytics: false` is sufficient.

Disclose in the privacy policy + `/legal/privacy` page.

## Data minimization

We collect what we need. When tempted to add a new column:

1. What feature requires it?
2. Can we infer it from existing data?
3. Can we store a hash / aggregate instead of the raw value?
4. Is it PII? If yes, update the redact list, the export workflow, the retention rule, and the privacy policy.

## Children's data

Joblify isn't directed at children. Terms require users to be 18+. We don't intentionally collect data from minors; if discovered, delete immediately.
