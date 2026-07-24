-- Digest watermark (#44) + AI-sweep attempts guard (#37).
--
-- Hand-authored (no dev DB in this environment), matching the repo pattern:
-- table names are the schema's @@map snake_case; column names follow the
-- schema's convention of unmapped camelCase fields (no field-level @map is
-- used anywhere in schema.prisma — see e.g. "emailSuppressedAt" on "users").

-- AlterTable: per-user digest watermark. Null = never digested. The digest
-- cron selects users with a null/stale watermark and stamps it after each
-- processed chunk, making re-runs resume instead of double-sending.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lastDigestAt" TIMESTAMP(3);

-- AlterTable: how many times the algolia-reconcile AI sweep retried a
-- stranded resume (parsedJson/embedding NULL). Capped at 5 in the route so
-- poison files can't loop forever.
ALTER TABLE "resumes" ADD COLUMN IF NOT EXISTS "parseAttempts" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex: partial index backing the daily digest eligibility scan
-- (WHERE mirrors the runDigest() selection; ASC NULLS FIRST matches its
-- oldest-watermark-first ordering, so never-digested users lead). Partial
-- indexes aren't expressible in Prisma schema — raw-SQL-only by design, like
-- the HNSW/GiST/GIN indexes from 20260609000000_init. If a future
-- `prisma migrate dev` diff proposes dropping it as drift, hand-remove that
-- DROP the same way 20260717114623_add_user_plan_tier documents.
CREATE INDEX IF NOT EXISTS "users_digest_eligibility_idx"
    ON "users" ("lastDigestAt" ASC NULLS FIRST)
 WHERE "userType" = 'JOB_SEEKER'
   AND "deletedAt" IS NULL
   AND "emailSuppressedAt" IS NULL
   AND "consentJson" IS NOT NULL;
