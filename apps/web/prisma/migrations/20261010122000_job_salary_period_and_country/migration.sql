-- Pay period + country on job posts.
--
-- Hand-authored (no dev DB in this environment); see earlier migrations.
--
-- Why: `salaryMin`/`salaryMax` were bare integers and the JobPosting JSON-LD
-- asserted `unitText: 'YEAR'` for all of them, so a monthly or hourly figure was
-- published to Google as an annual one. Google also *requires*
-- `jobLocation.address.addressCountry`, which free-text `location` cannot
-- supply. Both columns are additive; existing rows were entered as annual
-- figures (the only thing the markup ever claimed), so YEAR is the truthful
-- default and no backfill is needed.
BEGIN;

CREATE TYPE "SalaryPeriod" AS ENUM ('HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR');

ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "salaryPeriod" "SalaryPeriod" NOT NULL DEFAULT 'YEAR';
ALTER TABLE "job_posts" ADD COLUMN IF NOT EXISTS "locationCountry" TEXT;

COMMIT;
