-- Flowchart + use-case (usecases_002, JOB_UC_01–14) flows:
-- Employable/Virtual-Intern profile types, per-type company subscriptions,
-- typed company→seeker invitations, and job-specific + virtual-intern chat
-- areas.

-- CreateEnum
CREATE TYPE "ProfileType" AS ENUM ('EMPLOYABLE', 'VIRTUAL_INTERN');

-- CreateEnum
CREATE TYPE "ChatAreaKind" AS ENUM ('JOB', 'VIRTUAL_INTERN');

-- CreateEnum
CREATE TYPE "ChatMessageKind" AS ENUM ('TEXT', 'MATERIAL', 'INTERVIEW_DETAILS');

-- AlterEnum (values are not referenced inside this migration, so ADD VALUE is
-- transaction-safe on Postgres 12+)
ALTER TYPE "NotificationKind" ADD VALUE 'JOB_SHARED';
ALTER TYPE "NotificationKind" ADD VALUE 'CHAT_AREA_ADDED';
ALTER TYPE "NotificationKind" ADD VALUE 'NEW_SUBSCRIBER';
ALTER TYPE "NotificationKind" ADD VALUE 'INVITATION_RESPONDED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SUBSCRIPTION_CANCELLED';
ALTER TYPE "AuditAction" ADD VALUE 'CHAT_AREA_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'CHAT_PARTICIPANT_ADDED';
ALTER TYPE "AuditAction" ADD VALUE 'JOB_SHARED';
ALTER TYPE "AuditAction" ADD VALUE 'INVITATION_SENT';
ALTER TYPE "AuditAction" ADD VALUE 'INVITATION_RESPONDED';

-- AlterTable
ALTER TABLE "job_seeker_profiles" ADD COLUMN "profileType" "ProfileType" NOT NULL DEFAULT 'EMPLOYABLE';
ALTER TABLE "job_seeker_profiles" ADD COLUMN "careerInterest" TEXT;
ALTER TABLE "job_seeker_profiles" ADD COLUMN "availabilityHoursPerWeek" INTEGER;
ALTER TABLE "job_seeker_profiles" ADD COLUMN "learningGoal" TEXT;

-- AlterTable: invitations become typed (invite as EMPLOYABLE or
-- VIRTUAL_INTERN) and unique per company/seeker/type instead of per job.
ALTER TABLE "invitations" ADD COLUMN "profileType" "ProfileType" NOT NULL DEFAULT 'EMPLOYABLE';
DROP INDEX "invitations_companyId_jobSeekerId_jobPostId_key";
CREATE UNIQUE INDEX "invitations_companyId_jobSeekerId_profileType_key" ON "invitations"("companyId", "jobSeekerId", "profileType");

-- CreateIndex
CREATE INDEX "job_seeker_profiles_visibility_profileType_idx" ON "job_seeker_profiles"("visibility", "profileType");

-- CreateTable
CREATE TABLE "company_subscriptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "jobSeekerId" UUID NOT NULL,
    "profileType" "ProfileType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_areas" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "kind" "ChatAreaKind" NOT NULL,
    "companyId" UUID NOT NULL,
    "jobPostId" UUID,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_areas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_participants" (
    "chatAreaId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_participants_pkey" PRIMARY KEY ("chatAreaId","userId")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "chatAreaId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "kind" "ChatMessageKind" NOT NULL DEFAULT 'TEXT',
    "body" TEXT NOT NULL,
    "attachmentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "company_subscriptions_companyId_jobSeekerId_profileType_key" ON "company_subscriptions"("companyId", "jobSeekerId", "profileType");

-- CreateIndex
CREATE INDEX "company_subscriptions_companyId_profileType_idx" ON "company_subscriptions"("companyId", "profileType");

-- CreateIndex
CREATE INDEX "company_subscriptions_jobSeekerId_createdAt_idx" ON "company_subscriptions"("jobSeekerId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "chat_areas_jobPostId_key" ON "chat_areas"("jobPostId");

-- CreateIndex
CREATE INDEX "chat_areas_companyId_kind_idx" ON "chat_areas"("companyId", "kind");

-- CreateIndex
CREATE INDEX "chat_participants_userId_idx" ON "chat_participants"("userId");

-- CreateIndex
CREATE INDEX "chat_messages_chatAreaId_createdAt_idx" ON "chat_messages"("chatAreaId", "createdAt");

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_subscriptions" ADD CONSTRAINT "company_subscriptions_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_areas" ADD CONSTRAINT "chat_areas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_areas" ADD CONSTRAINT "chat_areas_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_chatAreaId_fkey" FOREIGN KEY ("chatAreaId") REFERENCES "chat_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_participants" ADD CONSTRAINT "chat_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_chatAreaId_fkey" FOREIGN KEY ("chatAreaId") REFERENCES "chat_areas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ============================================================================
-- Hand-written DDL — Prisma can't express partial unique indexes.
-- ============================================================================

-- At most one VIRTUAL_INTERN chat area per company (JOB areas are already
-- one-per-job via chat_areas_jobPostId_key).
CREATE UNIQUE INDEX "chat_areas_company_virtual_intern_unique"
  ON "chat_areas" ("companyId")
  WHERE "kind" = 'VIRTUAL_INTERN';
