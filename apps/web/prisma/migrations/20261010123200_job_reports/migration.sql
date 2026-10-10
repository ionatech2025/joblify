-- Trust & safety: users can report a job posting; admins resolve the queue.
--
-- Hand-authored (no dev DB in this environment) and checked against
-- `prisma migrate diff` from the previous schema. Purely additive.
--
-- reporterId is SET NULL on user deletion so erasing an account does not erase
-- the moderation record of what was reported; resolvedBy is deliberately not a
-- foreign key for the same reason.
BEGIN;

CREATE TYPE "JobReportReason" AS ENUM ('SCAM', 'DISCRIMINATORY', 'MISLEADING', 'DUPLICATE', 'OTHER');
CREATE TYPE "JobReportStatus" AS ENUM ('OPEN', 'ACTIONED', 'DISMISSED');

CREATE TABLE "job_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobPostId" UUID NOT NULL,
    "reporterId" UUID,
    "reason" "JobReportReason" NOT NULL,
    "details" TEXT,
    "status" "JobReportStatus" NOT NULL DEFAULT 'OPEN',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "job_reports_status_createdAt_idx" ON "job_reports"("status", "createdAt");
CREATE UNIQUE INDEX "job_reports_jobPostId_reporterId_key" ON "job_reports"("jobPostId", "reporterId");

ALTER TABLE "job_reports" ADD CONSTRAINT "job_reports_jobPostId_fkey"
    FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "job_reports" ADD CONSTRAINT "job_reports_reporterId_fkey"
    FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

COMMIT;
