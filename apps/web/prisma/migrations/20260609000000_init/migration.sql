-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('JOB_SEEKER', 'COMPANY', 'ADMIN');

-- CreateEnum
CREATE TYPE "IndustryType" AS ENUM ('TECHNOLOGY', 'HOSPITALITY', 'EDUCATION', 'AGRICULTURE', 'FINANCE', 'MANUFACTURING', 'CONSTRUCTION', 'HEALTHCARE', 'RETAIL', 'TRANSPORTATION', 'ENERGY', 'MEDIA', 'GOVERNMENT', 'NONPROFIT', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanySize" AS ENUM ('SIZE_1_10', 'SIZE_11_50', 'SIZE_51_200', 'SIZE_201_500', 'SIZE_501_1000', 'SIZE_1001_PLUS');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('ENTRY', 'MID', 'SENIOR', 'STAFF', 'EXECUTIVE');

-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "JobPostStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('SUBMITTED', 'VIEWED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'HIRED', 'REJECTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'NEW_APPLICANT', 'INTERVIEW_SCHEDULED', 'INVITATION_RECEIVED', 'ACCOUNT_UPDATE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_SIGNED_UP', 'USER_SIGNED_IN', 'USER_PROFILE_UPDATED', 'USER_DELETED', 'USER_EXPORTED', 'COMPANY_PROFILE_UPDATED', 'JOB_POSTED', 'JOB_UPDATED', 'JOB_DELETED', 'APPLICATION_SUBMITTED', 'APPLICATION_STATUS_CHANGED', 'APPLICATION_NOTE_SAVED', 'RESUME_UPLOADED', 'CONSENT_UPDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clerkUserId" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "userType" "UserType" NOT NULL DEFAULT 'JOB_SEEKER',
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "consentJson" JSONB,
    "emailSuppressedAt" TIMESTAMP(3),
    "emailSuppressionReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_seeker_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "bio" TEXT,
    "headline" TEXT,
    "yearsExperience" INTEGER,
    "desiredSalaryMin" INTEGER,
    "desiredSalaryMax" INTEGER,
    "desiredWorkMode" "WorkMode",
    "location" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "visibility" TEXT NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_seeker_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "industry" "IndustryType" NOT NULL,
    "companySize" "CompanySize" NOT NULL,
    "establishmentYear" INTEGER,
    "description" TEXT NOT NULL,
    "logoUrl" TEXT,
    "website" TEXT,
    "linkedin" TEXT,
    "address" TEXT,
    "contactPersonName" TEXT,
    "contactPersonPosition" TEXT,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "escoUri" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_post_skills" (
    "jobPostId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "job_post_skills_pkey" PRIMARY KEY ("jobPostId","skillId")
);

-- CreateTable
CREATE TABLE "job_seeker_skills" (
    "jobSeekerProfileId" UUID NOT NULL,
    "skillId" UUID NOT NULL,
    "proficiency" INTEGER NOT NULL DEFAULT 3,
    "years" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "job_seeker_skills_pkey" PRIMARY KEY ("jobSeekerProfileId","skillId")
);

-- CreateTable
CREATE TABLE "job_posts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "slug" TEXT NOT NULL,
    "companyId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "benefits" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "industry" "IndustryType" NOT NULL,
    "jobType" "JobType" NOT NULL,
    "experienceLevel" "ExperienceLevel" NOT NULL DEFAULT 'MID',
    "workMode" "WorkMode" NOT NULL DEFAULT 'ONSITE',
    "location" TEXT,
    "locationLat" DOUBLE PRECISION,
    "locationLng" DOUBLE PRECISION,
    "geo" geography(Point, 4326),
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "applicationDeadline" TIMESTAMP(3),
    "status" "JobPostStatus" NOT NULL DEFAULT 'DRAFT',
    "embedding" vector(1536),
    "tsv" tsvector,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobPostId" UUID NOT NULL,
    "jobSeekerId" UUID NOT NULL,
    "resumeId" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "coverLetter" TEXT,
    "recruiterNotes" TEXT,
    "matchScore" DOUBLE PRECISION,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_views" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobPostId" UUID NOT NULL,
    "userId" UUID,
    "ipHash" TEXT NOT NULL,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_jobs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "jobPostId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saved_searches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "index_outbox" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "entityId" UUID NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "index_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "fileBlobUrl" TEXT NOT NULL,
    "fileMime" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "parsedJson" JSONB,
    "embedding" vector(1536),
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resumes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID NOT NULL,
    "jobSeekerId" UUID NOT NULL,
    "jobPostId" UUID,
    "message" TEXT,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "actorId" UUID,
    "action" "AuditAction" NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "before" JSONB,
    "after" JSONB,
    "ip" TEXT,
    "ua" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_clerkUserId_key" ON "users"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_userType_deletedAt_idx" ON "users"("userType", "deletedAt");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "job_seeker_profiles_userId_key" ON "job_seeker_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_userId_key" ON "company_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "company_profiles_slug_key" ON "company_profiles"("slug");

-- CreateIndex
CREATE INDEX "company_profiles_industry_verificationStatus_idx" ON "company_profiles"("industry", "verificationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "skills_slug_key" ON "skills"("slug");

-- CreateIndex
CREATE INDEX "skills_label_idx" ON "skills"("label");

-- CreateIndex
CREATE INDEX "job_post_skills_skillId_idx" ON "job_post_skills"("skillId");

-- CreateIndex
CREATE INDEX "job_seeker_skills_skillId_idx" ON "job_seeker_skills"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "job_posts_slug_key" ON "job_posts"("slug");

-- CreateIndex
CREATE INDEX "job_posts_companyId_status_deletedAt_idx" ON "job_posts"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "job_posts_status_publishedAt_idx" ON "job_posts"("status", "publishedAt" DESC);

-- CreateIndex
CREATE INDEX "job_posts_industry_status_idx" ON "job_posts"("industry", "status");

-- CreateIndex
CREATE INDEX "job_posts_deletedAt_idx" ON "job_posts"("deletedAt");

-- CreateIndex
CREATE INDEX "job_applications_jobSeekerId_appliedAt_idx" ON "job_applications"("jobSeekerId", "appliedAt" DESC);

-- CreateIndex
CREATE INDEX "job_applications_jobPostId_status_idx" ON "job_applications"("jobPostId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_jobPostId_jobSeekerId_key" ON "job_applications"("jobPostId", "jobSeekerId");

-- CreateIndex
CREATE INDEX "job_views_jobPostId_createdAt_idx" ON "job_views"("jobPostId", "createdAt");

-- CreateIndex
CREATE INDEX "job_views_createdAt_idx" ON "job_views"("createdAt");

-- CreateIndex
CREATE INDEX "saved_jobs_userId_createdAt_idx" ON "saved_jobs"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "saved_jobs_userId_jobPostId_key" ON "saved_jobs"("userId", "jobPostId");

-- CreateIndex
CREATE INDEX "saved_searches_userId_createdAt_idx" ON "saved_searches"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "index_outbox_createdAt_idx" ON "index_outbox"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "index_outbox_entityId_key" ON "index_outbox"("entityId");

-- CreateIndex
CREATE INDEX "resumes_userId_isDefault_idx" ON "resumes"("userId", "isDefault");

-- CreateIndex
CREATE INDEX "resumes_userId_deletedAt_idx" ON "resumes"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_createdAt_idx" ON "notifications"("userId", "readAt", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "invitations_jobSeekerId_status_idx" ON "invitations"("jobSeekerId", "status");

-- CreateIndex
CREATE INDEX "invitations_companyId_status_idx" ON "invitations"("companyId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_companyId_jobSeekerId_jobPostId_key" ON "invitations"("companyId", "jobSeekerId", "jobPostId");

-- CreateIndex
CREATE INDEX "audit_events_actorId_createdAt_idx" ON "audit_events"("actorId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "audit_events_entity_entityId_idx" ON "audit_events"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_events_action_createdAt_idx" ON "audit_events"("action", "createdAt" DESC);

-- AddForeignKey
ALTER TABLE "job_seeker_profiles" ADD CONSTRAINT "job_seeker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_profiles" ADD CONSTRAINT "company_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_skills" ADD CONSTRAINT "job_post_skills_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_post_skills" ADD CONSTRAINT "job_post_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_skills" ADD CONSTRAINT "job_seeker_skills_jobSeekerProfileId_fkey" FOREIGN KEY ("jobSeekerProfileId") REFERENCES "job_seeker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_seeker_skills" ADD CONSTRAINT "job_seeker_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_posts" ADD CONSTRAINT "job_posts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_views" ADD CONSTRAINT "job_views_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_jobs" ADD CONSTRAINT "saved_jobs_jobPostId_fkey" FOREIGN KEY ("jobPostId") REFERENCES "job_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "saved_searches" ADD CONSTRAINT "saved_searches_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- ============================================================================
-- Hand-written DDL for Unsupported() columns — Prisma can't express these.
-- ============================================================================

-- pgvector cosine ANN indexes. match-score / match-badge query with the <=>
-- cosine-distance operator (resume vs job embedding); HNSW gives fast recall.
CREATE INDEX "resumes_embedding_hnsw" ON "resumes" USING hnsw ("embedding" vector_cosine_ops);
CREATE INDEX "job_posts_embedding_hnsw" ON "job_posts" USING hnsw ("embedding" vector_cosine_ops);

-- Full-text-search fallback. Maintain job_posts.tsv from title/description/
-- requirements via a trigger (no app writes, no Prisma column drift), GIN-indexed.
CREATE OR REPLACE FUNCTION job_posts_tsv_refresh() RETURNS trigger AS $$
BEGIN
  NEW."tsv" :=
    setweight(to_tsvector('english', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW."description", '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW."requirements", '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER job_posts_tsv_trg
  BEFORE INSERT OR UPDATE OF "title", "description", "requirements"
  ON "job_posts"
  FOR EACH ROW EXECUTE FUNCTION job_posts_tsv_refresh();

CREATE INDEX "job_posts_tsv_gin" ON "job_posts" USING gin ("tsv");

-- PostGIS spatial index for geo radius queries.
CREATE INDEX "job_posts_geo_gist" ON "job_posts" USING gist ("geo");

-- pg_trgm fuzzy index for typo-tolerant title matching.
CREATE INDEX "job_posts_title_trgm" ON "job_posts" USING gin ("title" gin_trgm_ops);
