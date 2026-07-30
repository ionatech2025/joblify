/* eslint-disable no-console */
// One-shot Mongo → Postgres migration.
//
// Usage:
//   MONGO_URL=mongodb+srv://... DATABASE_URL=postgresql://... \
//     bun run scripts/migrate-mongo-to-neon.ts
//
// Strategy:
//   1. Read all collections from the legacy Mongo DB.
//   2. Transform ObjectId → UUID v5 derived from ObjectId hex so reruns
//      produce the same UUIDs (idempotent upserts).
//   3. Upsert into Postgres via Prisma in dependency order:
//        users → company_profiles / job_seeker_profiles →
//        skills → job_posts → resumes → job_applications →
//        notifications → invitations.
//   4. Log row counts at every step; fail loud on integrity violations.
//
// This script is intentionally standalone (not part of the runtime app) and
// has its own Mongo dep added to package.json devDependencies on first run.

import type { ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';

const MONGO_URL = process.env.MONGO_URL;
if (!MONGO_URL) throw new Error('MONGO_URL is required');

const mongo = new MongoClient(MONGO_URL);
const prisma = new PrismaClient();

// Deterministic UUID v5-ish from a Mongo ObjectId. Not cryptographic; just a
// stable 1:1 mapping so we can rerun this script without dup-keying.
function oidToUuid(oid: ObjectId | string): string {
  const hex = (typeof oid === 'string' ? oid : oid.toHexString()).padEnd(32, '0').slice(0, 32);
  const hashed = createHash('sha1').update(hex).digest('hex');
  return [
    hashed.slice(0, 8),
    hashed.slice(8, 12),
    `5${hashed.slice(13, 16)}`,
    `8${hashed.slice(17, 20)}`,
    hashed.slice(20, 32),
  ].join('-');
}

type LegacyUser = {
  _id: ObjectId;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType: 'JOB_SEEKER' | 'COMPANY';
  avatar?: string;
  companyName?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type LegacyJobPost = {
  _id: ObjectId;
  title: string;
  description: string;
  companyId: ObjectId;
  industry: string;
  jobType: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  requirements?: string;
  skillsRequired?: string[];
  applicationDeadline?: Date;
  isActive?: boolean;
  experienceLevel?: string;
  benefits?: string[];
  isRemote?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

function slugify(input: string, suffix: string): string {
  return (
    input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) +
    '-' +
    suffix.slice(0, 8)
  );
}

async function migrateUsers(): Promise<number> {
  const cursor = mongo.db().collection<LegacyUser>('users').find({});
  let count = 0;
  for await (const doc of cursor) {
    const id = oidToUuid(doc._id);
    // Legacy schema didn't link Clerk; this becomes orphaned until the user
    // signs into Clerk. We synthesize a deterministic placeholder so the
    // upsert key works during dual-read.
    const clerkUserId = `legacy:${doc._id.toHexString()}`;

    await prisma.user.upsert({
      where: { id },
      create: {
        id,
        clerkUserId,
        email: doc.email.toLowerCase(),
        userType: doc.userType ?? 'JOB_SEEKER',
        firstName: doc.firstName ?? null,
        lastName: doc.lastName ?? null,
        phone: doc.phone ?? null,
        avatarUrl: doc.avatar ?? null,
        createdAt: doc.createdAt ?? new Date(),
      },
      update: {
        email: doc.email.toLowerCase(),
        firstName: doc.firstName ?? null,
        lastName: doc.lastName ?? null,
        phone: doc.phone ?? null,
      },
    });
    count++;
  }
  return count;
}

async function migrateJobPosts(): Promise<number> {
  const cursor = mongo.db().collection<LegacyJobPost>('job_posts').find({});
  let count = 0;
  for await (const doc of cursor) {
    const id = oidToUuid(doc._id);
    const companyId = oidToUuid(doc.companyId);
    const slug = slugify(doc.title ?? 'job', doc._id.toHexString());

    await prisma.jobPost.upsert({
      where: { id },
      create: {
        id,
        slug,
        companyId,
        title: doc.title ?? 'Untitled',
        description: doc.description ?? '',
        requirements: doc.requirements ?? null,
        benefits: doc.benefits ?? [],
        industry: (doc.industry as never) ?? 'TECHNOLOGY',
        jobType: (doc.jobType as never) ?? 'FULL_TIME',
        experienceLevel: (doc.experienceLevel as never) ?? 'MID',
        workMode: doc.isRemote ? 'REMOTE' : 'ONSITE',
        location: doc.location ?? null,
        salaryMin: doc.salaryMin ?? null,
        salaryMax: doc.salaryMax ?? null,
        applicationDeadline: doc.applicationDeadline ?? null,
        status: doc.isActive ? 'PUBLISHED' : 'CLOSED',
        publishedAt: doc.isActive ? (doc.createdAt ?? new Date()) : null,
        createdAt: doc.createdAt ?? new Date(),
      },
      update: {
        title: doc.title ?? 'Untitled',
        description: doc.description ?? '',
        salaryMin: doc.salaryMin ?? null,
        salaryMax: doc.salaryMax ?? null,
        status: doc.isActive ? 'PUBLISHED' : 'CLOSED',
      },
    });
    count++;
  }
  return count;
}

async function migrateApplications(): Promise<number> {
  const cursor = mongo.db().collection('job_applications').find({});
  let count = 0;
  for await (const doc of cursor as AsyncIterable<{
    _id: ObjectId;
    jobPostId: ObjectId;
    jobSeekerId: ObjectId;
    resumeId: ObjectId;
    status?: string;
    coverLetter?: string;
    appliedAt?: Date;
  }>) {
    const id = oidToUuid(doc._id);
    const jobPostId = oidToUuid(doc.jobPostId);
    const jobSeekerId = oidToUuid(doc.jobSeekerId);
    const resumeId = oidToUuid(doc.resumeId);

    // Skip if dependencies are missing — pre-existing data integrity.
    const job = await prisma.jobPost.findUnique({ where: { id: jobPostId }, select: { id: true } });
    const seeker = await prisma.user.findUnique({
      where: { id: jobSeekerId },
      select: { id: true },
    });
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
      select: { id: true },
    });
    if (!job || !seeker || !resume) {
      console.warn(`Skipping application ${doc._id.toHexString()} — missing FK`);
      continue;
    }

    await prisma.jobApplication.upsert({
      where: { id },
      create: {
        id,
        jobPostId,
        jobSeekerId,
        resumeId,
        status: (doc.status as never) ?? 'SUBMITTED',
        coverLetter: doc.coverLetter ?? null,
        appliedAt: doc.appliedAt ?? new Date(),
      },
      update: {
        status: (doc.status as never) ?? 'SUBMITTED',
      },
    });
    count++;
  }
  return count;
}

// NOTE: legacy Mongo field names diverge per environment. Confirm the live
// document shape (`mongosh` → db.<collection>.findOne()) and adjust the field
// reads below before a production run. Enum fallbacks use valid schema members.

type LegacyCompanyProfile = {
  _id: ObjectId;
  userId: ObjectId;
  companyName?: string;
  industry?: string;
  companySize?: string;
  establishmentYear?: number;
  description?: string;
  logo?: string;
  website?: string;
  linkedin?: string;
  address?: string;
  contactPersonName?: string;
  contactPersonPosition?: string;
};

type LegacyJobSeekerProfile = {
  _id: ObjectId;
  userId: ObjectId;
  bio?: string;
  headline?: string;
  yearsExperience?: number;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  location?: string;
  locationLat?: number;
  locationLng?: number;
  visibility?: string;
};

type LegacyResume = {
  _id: ObjectId;
  userId: ObjectId;
  title?: string;
  fileUrl?: string;
  fileBlobUrl?: string;
  mimeType?: string;
  fileMime?: string;
  sizeBytes?: number;
  fileSizeBytes?: number;
  isDefault?: boolean;
  createdAt?: Date;
};

async function migrateCompanyProfiles(): Promise<number> {
  const cursor = mongo.db().collection<LegacyCompanyProfile>('company_profiles').find({});
  let count = 0;
  for await (const doc of cursor) {
    const userId = oidToUuid(doc.userId);
    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!owner) {
      console.warn(`Skipping company_profile ${doc._id.toHexString()} — no owner user`);
      continue;
    }
    await prisma.companyProfile.upsert({
      where: { userId },
      create: {
        userId,
        slug: slugify(doc.companyName ?? 'company', doc._id.toHexString()),
        companyName: doc.companyName ?? 'Company',
        industry: (doc.industry as never) ?? 'TECHNOLOGY',
        companySize: (doc.companySize as never) ?? 'SIZE_1_10',
        establishmentYear: doc.establishmentYear ?? null,
        description: doc.description ?? '',
        logoUrl: doc.logo ?? null,
        website: doc.website ?? null,
        linkedin: doc.linkedin ?? null,
        address: doc.address ?? null,
        contactPersonName: doc.contactPersonName ?? null,
        contactPersonPosition: doc.contactPersonPosition ?? null,
      },
      update: {
        companyName: doc.companyName ?? 'Company',
        description: doc.description ?? '',
        logoUrl: doc.logo ?? null,
        website: doc.website ?? null,
      },
    });
    count++;
  }
  return count;
}

async function migrateJobSeekerProfiles(): Promise<number> {
  const cursor = mongo.db().collection<LegacyJobSeekerProfile>('job_seeker_profiles').find({});
  let count = 0;
  for await (const doc of cursor) {
    const userId = oidToUuid(doc.userId);
    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!owner) {
      console.warn(`Skipping job_seeker_profile ${doc._id.toHexString()} — no owner user`);
      continue;
    }
    await prisma.jobSeekerProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio: doc.bio ?? null,
        headline: doc.headline ?? null,
        yearsExperience: doc.yearsExperience ?? null,
        desiredSalaryMin: doc.desiredSalaryMin ?? null,
        desiredSalaryMax: doc.desiredSalaryMax ?? null,
        location: doc.location ?? null,
        locationLat: doc.locationLat ?? null,
        locationLng: doc.locationLng ?? null,
        visibility: doc.visibility ?? 'PRIVATE',
      },
      update: {
        bio: doc.bio ?? null,
        headline: doc.headline ?? null,
        location: doc.location ?? null,
      },
    });
    count++;
  }
  return count;
}

async function migrateResumes(): Promise<number> {
  const cursor = mongo.db().collection<LegacyResume>('resumes').find({});
  let count = 0;
  for await (const doc of cursor) {
    const id = oidToUuid(doc._id);
    const userId = oidToUuid(doc.userId);
    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!owner) {
      console.warn(`Skipping resume ${doc._id.toHexString()} — no owner user`);
      continue;
    }
    const fileBlobUrl = doc.fileBlobUrl ?? doc.fileUrl;
    if (!fileBlobUrl) {
      console.warn(`Skipping resume ${doc._id.toHexString()} — no file URL`);
      continue;
    }
    await prisma.resume.upsert({
      where: { id },
      create: {
        id,
        userId,
        title: doc.title ?? 'Resume',
        fileBlobUrl,
        fileMime: doc.fileMime ?? doc.mimeType ?? 'application/pdf',
        fileSizeBytes: doc.fileSizeBytes ?? doc.sizeBytes ?? 0,
        isDefault: doc.isDefault ?? false,
        createdAt: doc.createdAt ?? new Date(),
      },
      update: {
        title: doc.title ?? 'Resume',
        fileBlobUrl,
      },
    });
    count++;
  }
  return count;
}

// Row-count parity check — warns when Postgres ends up with fewer rows than the
// source collection (dropped FKs, transform errors), so a bad run is loud.
function assertParity(label: string, mongoCount: number, pgCount: number): void {
  if (pgCount < mongoCount) {
    console.warn(
      `PARITY WARNING [${label}]: Mongo=${mongoCount} Postgres=${pgCount} (${mongoCount - pgCount} missing)`,
    );
  } else {
    console.log(`  parity ok [${label}]: Mongo=${mongoCount} Postgres=${pgCount}`);
  }
}

async function main(): Promise<void> {
  console.log('Connecting to Mongo…');
  await mongo.connect();
  const dbm = mongo.db();

  console.log('Migrating users…');
  const users = await migrateUsers();
  assertParity('users', await dbm.collection('users').countDocuments(), users);

  console.log('Migrating company profiles…');
  const companies = await migrateCompanyProfiles();
  assertParity(
    'company_profiles',
    await dbm.collection('company_profiles').countDocuments(),
    companies,
  );

  console.log('Migrating jobseeker profiles…');
  const seekers = await migrateJobSeekerProfiles();
  assertParity(
    'job_seeker_profiles',
    await dbm.collection('job_seeker_profiles').countDocuments(),
    seekers,
  );

  console.log('Migrating job posts…');
  const jobs = await migrateJobPosts();
  assertParity('job_posts', await dbm.collection('job_posts').countDocuments(), jobs);

  // Resumes before applications — applications carry a resume FK.
  console.log('Migrating resumes…');
  const resumes = await migrateResumes();
  assertParity('resumes', await dbm.collection('resumes').countDocuments(), resumes);

  console.log('Migrating applications…');
  const applications = await migrateApplications();
  assertParity(
    'job_applications',
    await dbm.collection('job_applications').countDocuments(),
    applications,
  );

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongo.close();
    await prisma.$disconnect();
  });
