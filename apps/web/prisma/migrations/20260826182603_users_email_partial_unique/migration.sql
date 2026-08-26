-- users.email: partial-unique (active rows only) instead of global-unique.
--
-- Hand-authored (no dev DB in this environment), matching the repo pattern:
-- table names are the schema's @@map snake_case; column names follow the
-- schema's convention of unmapped camelCase fields.
--
-- Why: deleteMyAccount only soft-deletes (deletedAt set; a retention
-- workflow hard-deletes 30 days later). Until that hard delete runs, the old
-- row's global-unique email constraint permanently blocks the same person
-- signing back up with the same email — including via Google, where
-- "delete my account, sign back in with the same Google identity" is a
-- completely ordinary retry. The new Clerk user hits it two ways: the
-- clerk webhook's upsert throws on create (unique violation), and
-- lib/auth.ts's provisionFromClerk catches that, re-reads by the *new*
-- clerkUserId, finds nothing (the old row belongs to the *old* one), and
-- returns null — so requireUser() redirects a legitimately Clerk-signed-in
-- user to /sign-in forever. Scoping uniqueness to non-deleted rows closes
-- that window instead of just shortening it.
--
-- Ordering + transaction: the new partial unique index is created *before*
-- the old global-unique one is dropped, and both DDLs run in one
-- transaction — current data already satisfies the (stricter) old
-- constraint, so it trivially satisfies the new one too, and this way
-- there's never a moment with neither index enforcing uniqueness, and a
-- failure anywhere rolls back to the untouched original state rather than
-- leaving the table half-migrated. IF EXISTS/IF NOT EXISTS still guard each
-- statement so a retry after a genuine failure is also safe.
BEGIN;

-- CreateIndex: general-purpose (non-unique) lookup support for call sites
-- that query by email without a deletedAt filter, e.g. the Resend
-- bounce/complaint webhook's updateMany over a raw address list.
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");

-- CreateIndex: the real identity constraint, now scoped to active users
-- only. Partial unique indexes aren't expressible in Prisma schema —
-- raw-SQL-only by design, like chat_areas_company_virtual_intern_unique
-- (20260703000000_flowchart_flows) and users_digest_eligibility_idx
-- (20260724120000_digest_watermark_and_parse_attempts). If a future
-- `prisma migrate dev` diff proposes dropping this as drift, hand-remove
-- that DROP the same way 20260717114623_add_user_plan_tier documents.
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_active_unique"
    ON "users" ("email")
 WHERE "deletedAt" IS NULL;

-- DropIndex: the prior global-unique index (schema.prisma's old `@unique`
-- on email backed it with a plain CREATE UNIQUE INDEX, not a table
-- constraint — see users_email_key in 20260609000000_init).
DROP INDEX IF EXISTS "users_email_key";

COMMIT;
