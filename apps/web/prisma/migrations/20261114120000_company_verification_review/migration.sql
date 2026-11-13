-- Company verification outcome the company can read and act on.
--
-- Hand-authored (no dev DB in this environment) from `prisma migrate diff`
-- against the previous schema. Expand-only: both columns are nullable, so the
-- previous build keeps working while this applies.
--
-- rejectionReason is shown on /employer-setup and cleared when the company
-- resubmits; reviewedAt records when an admin last decided.
BEGIN;

ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "reviewedAt"      TIMESTAMP(3);

COMMIT;
