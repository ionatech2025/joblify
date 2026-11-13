-- Company verification lifecycle: the reason an admin gave for a rejection,
-- shown to the company so it can fix and resubmit, and when it was reviewed.
--
-- Hand-authored (no dev DB in this environment) and checked against
-- `prisma migrate diff` from the previous schema. Purely additive.

BEGIN;

ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "reviewedAt"      TIMESTAMP(3);

COMMIT;
