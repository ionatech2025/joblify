-- Explicit, withdrawable opt-in for the daily jobs digest.
--
-- Hand-authored (no dev DB in this environment); see the notes in the previous
-- migrations for the naming convention.
--
-- Why: the digest used to select `consentJson IS NOT NULL`, and the cookie
-- banner writes that column for *every* answer — including "Necessary only".
-- So declining cookies enrolled the user in marketing email, with no
-- unsubscribe link and no preference to turn it off. Email consent is its own
-- specific, affirmative act; this column is it. Everyone starts at false: no
-- existing row ever gave a valid email consent, and sending to them was the bug.
BEGIN;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "digestOptIn"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "digestOptInAt" TIMESTAMP(3);

-- The partial index that backs the digest eligibility scan must mirror the
-- query's WHERE, which no longer mentions consentJson. Create the replacement
-- before dropping the original so there is never a window without one.
-- (Partial indexes are not expressible in the Prisma schema; raw-SQL-only by
-- design, like users_digest_eligibility_idx before it.)
CREATE INDEX IF NOT EXISTS "users_digest_optin_eligibility_idx"
    ON "users" ("lastDigestAt" ASC NULLS FIRST)
 WHERE "userType" = 'JOB_SEEKER'
   AND "deletedAt" IS NULL
   AND "emailSuppressedAt" IS NULL
   AND "digestOptIn" = true;

DROP INDEX IF EXISTS "users_digest_eligibility_idx";

COMMIT;
