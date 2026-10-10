# Compliance

GDPR (EU/UK) and CCPA/CPRA (California) are the floors; the hiring-specific AI rules below are
the part that is easy to miss for a job platform. This document describes what the code **does**
— each claim names the file that enforces it. If you change the behaviour, change the sentence.

> **Status: engineering controls are in place; legal/organisational work is not.** A DPIA, signed
> DPAs, a registered controller identity, and counsel review of `app/(marketing)/legal/*` are still
> to do. They are listed under [Open items](#open-items-that-code-cannot-close).

## Legal basis (GDPR Article 6)

| Processing activity                           | Basis                                          |
| --------------------------------------------- | ---------------------------------------------- |
| Operating accounts, applications, chats       | Contract                                       |
| Résumé parsing and match scores               | Contract + legitimate interest (see AI, below) |
| Anti-fraud / abuse logs                       | Legitimate interest                            |
| Daily jobs digest email                       | **Consent** — `User.digestOptIn`               |
| Analytics (Vercel Analytics / Speed Insights) | **Consent** — cookie banner                    |
| Error replay (Sentry Replay)                  | **Consent** — cookie banner                    |
| Audit log                                     | Legitimate interest / legal obligation         |

### Email consent is its own consent

`User.digestOptIn` (default `false`) is the only thing that makes a user eligible for the digest
(`workflows/digest-email.workflow.ts`). It is set only by the toggle on `/jobseeker/notifications`
(`app/actions/email-preferences.ts`) and cleared by the one-click unsubscribe
(`app/api/v1/email/unsubscribe`). Answering the cookie banner — including "Necessary only" — does
**not** imply it (it used to: the digest selected `consentJson IS NOT NULL`).

Every digest carries a signed unsubscribe link in the body and RFC 8058
`List-Unsubscribe` / `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers
(`lib/email/unsubscribe.ts`). The run refuses to send at all when it cannot build that link
(`NEXT_PUBLIC_SITE_URL` + `EMAIL_UNSUBSCRIBE_SECRET`/`CRON_SECRET`), and every consent change is an
`AuditEvent` (`CONSENT_UPDATED`) with timestamp and channel, so consent can be demonstrated
(Art. 7(1)). `EMAIL_POSTAL_ADDRESS` is appended for CAN-SPAM.

Transactional mail (application confirmation, status change) is not marketing and has no
unsubscribe, but it **does** honour bounce/complaint suppression
(`isEmailSuppressed`, applied in `apply.ts` and `update-applicant-status.ts`).

## Subject rights

### Article 15 / 20 — access and portability

`POST /api/v1/account/export` (page: `/account/export`) returns one JSON document **directly to the
signed-in requester** (`workflows/gdpr-export.workflow.ts`). It is not stored and not emailed, so
there is no link to leak or to expire. It covers: account, profile and work history, company
profile and postings, applications (with recruiter notes and match score), résumés (with the
authenticated download path), notifications, invitations, saved jobs and searches, subscriptions,
chat memberships, chat messages sent, job views tied to the account, and audit events — plus a
`processing` block (purposes, recipients, the automated processing, retention, rights; Art. 15(1)).
Rate-limited to 2/day. For a company it contains the company's own data, not its applicants'.

Résumé files are served only by `GET /api/v1/resumes/[id]/file` — owner, or a company holding a
live application that used that résumé; everyone else gets 404.

### Article 17 — erasure

`/account/delete` → `deleteMyAccount` (`app/actions/account.ts`):

1. Soft-deletes the user and switches the digest off; **a company's job postings are archived in the
   same transaction**, so they leave the public site, sitemap and search immediately.
2. Deletes the Clerk user (revokes sessions) and de-indexes the postings from Algolia.
3. After 30 days the retention sweep (`workflows/retention.workflow.ts`) deletes the stored
   **files first** (résumés, generated CVs, logo), then the database rows. A user whose files could
   not be deleted is left for the next run rather than orphaning a personal document.

Deleting a single résumé erases row and file at once unless an employer already received it with an
application; then it is hidden from the owner and removed once those applications are gone
(`JobApplication.resumeId` is a RESTRICT foreign key).

### Article 16 / 21

Rectification: `/jobseeker/profile`. Objection / consent withdrawal: notification settings, the
cookie banner, or the unsubscribe link. Nothing in the product makes a solely automated decision
(next section), so Art. 22 rights are exercised by writing to the privacy contact for human review.

## Automated processing in hiring (AI)

Recruitment AI is regulated as high-risk in the EU and is the target of employment-specific rules in
several US states. The product's posture, and where each point lives:

| Control                                  | Where                                                                                           |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| No solely automated decisions            | No code path accepts/rejects. Status changes are recruiter actions (`update-applicant-status`). |
| Candidate-facing notice                  | Apply form disclosure + `/legal/ai`; privacy policy; export `processing` block                  |
| Score provenance                         | `JobApplication.matchModel` / `matchScoredAt`; `Resume                                          | JobPost.embeddingModel` |
| No cross-model comparison                | `runMatchScore` skips when resume/job vectors differ in model (`match-score.workflow.ts`)       |
| Score is for the **submitted** résumé    | `runMatchScore({ resumeId })`; re-scoring uses `JobApplication.resumeId`                        |
| Transparent limits                       | `/legal/ai` ("Limits you should know about")                                                    |
| Résumé text treated as untrusted data    | `lib/ai/untrusted.ts` (fenced, invisible characters stripped) — OWASP LLM01                     |
| Degraded mode is labelled, then upgraded | `parsedJson._source = 'heuristic'`; reconcile sweep re-parses with the model                    |
| Heuristic never invents                  | `lib/resume/heuristic-parser.ts` — no default job title, years only from dated entries          |
| Bias testing / DPIA                      | **Not done** — see open items                                                                   |

The match score is a raw embedding cosine; it is **not calibrated** and the 70 %/50 % colour bands in
`lib/ui/status.ts` are presentation, not a validated threshold. Treat any use of it for ranking or
filtering as in-scope for the regulations above (EU AI Act Annex III(4); Illinois HB 3773 notice;
California FEHA ADS regulations and CPPA ADMT rules; NYC Local Law 144 bias audit for NYC
candidates). Check current effective dates with counsel — they have been moving (e.g. the EU
"Digital Omnibus" postponed Annex III high-risk duties to 2 Dec 2027; Colorado replaced its AI Act).

## Audit log

`AuditEvent` is the compliance trail (`lib/audit.ts`, written in the same transaction as the change).

- IP address and user agent are **removed after 90 days**; the event itself after **1 year**
  (`retention.workflow.ts`, steps 6). `actorId` is nulled when the user is erased.
- Recruiter note text is never written to the audit log (only its length).

## Data processors

`/legal/processors` lists them. The page no longer asserts regions or "ZDR contracts": the region
column is published from `NEXT_PUBLIC_REGION_*` and reads "Not yet published" until set. **Set these
only when true** — the repository's own `.env.local` pointed at a US-East Neon host while the
previous version of this page said "EU".

AI requests can be forced onto zero-data-retention providers with `AI_GATEWAY_ZDR=1` (a Vercel
AI Gateway Pro/Enterprise feature; the Gateway fails closed if no ZDR provider is available).
Without it, do not claim ZDR anywhere — `/legal/ai` switches its wording on that variable.

## Data residency

Not guaranteed by the code. Function region is a Vercel project setting (`vercel.ts` carries no
`regions`; multi-region requires Pro), and the database region is whatever the Neon project was
created in. Choose both deliberately, put them next to each other (a cross-region database costs
~100 ms per round trip), and then publish them via the `NEXT_PUBLIC_REGION_*` variables.

## Retention

Defined in `workflows/retention.workflow.ts` (daily 02:00 UTC, idempotent):

| Data                         | Kept                                               | Then                                        |
| ---------------------------- | -------------------------------------------------- | ------------------------------------------- |
| Deleted user account         | 30 days soft                                       | Files then rows hard-deleted                |
| Résumé deleted by owner      | Immediately, or until its applications are removed | File + row erased (30-day grace if applied) |
| `AuditEvent` IP / user agent | 90 days                                            | Nulled                                      |
| `AuditEvent`                 | 1 year                                             | Deleted                                     |
| `JobView`                    | 13 months                                          | Deleted                                     |
| Notification (read / unread) | 6 months / 90 days                                 | Deleted                                     |
| Invitation                   | 90 days past expiry                                | Deleted                                     |
| Legacy `exports/` blobs      | 24 h                                               | Deleted (exports are no longer stored)      |

## Consent, cookies and telemetry

`app/components/cookie-banner.tsx`: "Accept all" / "Necessary only", symmetric. Choice is a
`joblify_consent` cookie plus a mirror on `User.consentJson` when signed in (`/api/v1/consent`).

| Thing                             | Before consent                        | After "Accept all"  |
| --------------------------------- | ------------------------------------- | ------------------- |
| Vercel Analytics / Speed Insights | not loaded                            | loaded              |
| Sentry Replay (sessionStorage)    | not armed                             | armed (on error)    |
| Sentry error capture              | on                                    | on                  |
| Job-view beacon                   | counts only (no user id, no referrer) | + user id, referrer |
| Core Web Vitals to Sentry         | on (metric name/value only)           | on                  |

IP addresses are never stored raw for analytics: `hashIpForAnalytics` is an HMAC keyed by a server
secret and salted with the UTC date, so it is neither reversible by enumeration nor linkable across
days.

**Not implemented:** honouring the Global Privacy Control signal (`Sec-GPC`) server-side. Required
for California; tracked in REMAINING_STEPS.

## Accessibility

WCAG 2.2 AA target. Statement at `/accessibility`; automated axe checks run on preview deploys
(`.github/workflows/lighthouse.yml`) and the unit suite asserts autocomplete tokens and label
association. Manual screen-reader passes are a process commitment, not a repo artefact.

## Breach response

GDPR Art. 33: notify the supervisory authority within 72 h of becoming aware; Art. 34: notify
affected users without undue delay if high risk. Detect (Sentry, audit log) → contain (rotate keys,
revoke sessions, roll back) → assess scope → notify DPO/counsel → file within 72 h if exposure is
confirmed → postmortem. Contacts come from `NEXT_PUBLIC_PRIVACY_EMAIL` / `NEXT_PUBLIC_LEGAL_EMAIL`.

## Open items that code cannot close

1. **Controller identity and contacts** — set `NEXT_PUBLIC_CONTROLLER_NAME/ADDRESS`,
   `NEXT_PUBLIC_PRIVACY_EMAIL`, `NEXT_PUBLIC_ACCESSIBILITY_EMAIL`, `EMAIL_POSTAL_ADDRESS`.
2. **DPIA** for résumé parsing + match scoring (GDPR Art. 35: systematic evaluation of people).
3. **DPAs / transfer mechanism** with each processor, and the actual regions published.
4. **Bias testing** of the match score on representative data before relying on it to rank people;
   record the result next to `matchModel`.
5. **Counsel review** of `legal/privacy`, `legal/ai`, `legal/terms` (the transfer-safeguard sentence
   and the employer/controller description in particular).
6. **GPC** support and a "Do Not Sell or Share" position statement for CPRA.
7. **Rotate the credentials leaked in git history** (see `docs/SECURITY.md`).
