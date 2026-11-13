BEGIN;

ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
ALTER TABLE "company_profiles" ADD COLUMN IF NOT EXISTS "reviewedAt"      TIMESTAMP(3);

COMMIT;
