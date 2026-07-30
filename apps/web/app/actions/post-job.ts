'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { after } from 'next/server';
import type { z } from 'zod';
import { generateObject } from 'ai';
import * as Sentry from '@sentry/nextjs';
import { requireRole, assertPlan, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { JdSkillsSchema, JD_SKILLS_SYSTEM } from '@/lib/ai/prompts/jd-skills';
import { reindexJob } from '@/lib/search/index-job';
import { logger } from '@/lib/observability/logger';
import { postJobLimit } from '@/lib/ratelimit';
import { embedJobPost } from '@/workflows/match-score.workflow';
import { PostJobFormSchema } from '../company/jobs/job-form-schema';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60);
}

function uniqueSlug(base: string): string {
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

const Input = PostJobFormSchema;

export async function postJob(input: z.infer<typeof Input>): Promise<string> {
  const user = await requireRole('COMPANY');

  // Each post triggers a paid AI skill-extraction call + an Algolia reindex —
  // throttle before doing any other work.
  const rl = await postJobLimit(user.id);
  if (!rl.success) throw new Error('Daily job-posting limit reached. Try again tomorrow.');

  const parsed = Input.parse(input);

  // JOB_UC_11.0: creating a job-specific chat area is a premium feature.
  if (parsed.createChatArea) assertPlan(user, 'PRO');

  // No duplicate titles for the same company among its live postings.
  const duplicate = await db.jobPost.findFirst({
    where: {
      companyId: user.id,
      deletedAt: null,
      title: { equals: parsed.title, mode: 'insensitive' },
    },
    select: { id: true },
  });
  if (duplicate) throw new Error('You already have a job post with this title.');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  const baseSlug = slugify(parsed.title) || 'job';
  const slug = uniqueSlug(baseSlug);

  // Persist the job first; AI skill extraction is best-effort after the fact.
  const job = await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'JOB_POSTED',
      entity: 'job_post',
      after: (j) => ({ id: j.id, status: j.status, title: j.title }),
    },
    async (tx) =>
      tx.jobPost.create({
        data: {
          slug,
          companyId: user.id,
          title: parsed.title,
          description: parsed.description,
          requirements: parsed.requirements || null,
          industry: parsed.industry,
          jobType: parsed.jobType,
          experienceLevel: parsed.experienceLevel,
          workMode: parsed.workMode,
          location: parsed.location || null,
          salaryMin: parsed.salaryMin,
          salaryMax: parsed.salaryMax,
          salaryCurrency: parsed.salaryCurrency,
          applicationDeadline: parsed.applicationDeadline
            ? new Date(parsed.applicationDeadline)
            : null,
          status: parsed.publish ? 'PUBLISHED' : 'DRAFT',
          publishedAt: parsed.publish ? new Date() : null,
          // JOB_UC_11.0: optional job-specific chat area at creation; the
          // company joins immediately, applicants on shortlist.
          ...(parsed.createChatArea
            ? {
                chatArea: {
                  create: {
                    kind: 'JOB' as const,
                    companyId: user.id,
                    title: parsed.title,
                    participants: { create: { userId: user.id } },
                  },
                },
              }
            : {}),
        },
      }),
  );

  // Off the response path: on Fluid Compute a floating promise can be dropped
  // the moment the response is sent, so every post-save side effect runs
  // inside after() (same pattern as actions/apply.ts). Skills first — the
  // Algolia record includes them — then the index push, then the JD embedding
  // for published jobs (powers /jobseeker/matches + the match badge).
  // Best-effort: failures are logged + sent to Sentry, never surfaced.
  after(async () => {
    try {
      await extractAndLinkSkills(
        job.id,
        parsed.title,
        parsed.description,
        parsed.requirements ?? '',
      );
    } catch (err) {
      logger.warn({ err, jobId: job.id }, 'JD skill extraction failed (non-blocking)');
      Sentry.captureException(err, { tags: { jobId: job.id } });
    }
    try {
      await reindexJob(job.id);
    } catch (err) {
      logger.warn({ err, jobId: job.id }, 'Algolia index push failed (non-blocking)');
      Sentry.captureException(err, { tags: { jobId: job.id } });
    }
    if (parsed.publish) {
      try {
        await embedJobPost(job.id);
      } catch (err) {
        logger.warn({ err, jobId: job.id }, 'JD embedding failed (non-blocking)');
        Sentry.captureException(err, { tags: { jobId: job.id } });
      }
    }
  });

  updateTag(tags.jobs());
  updateTag(tags.company(user.id));

  logger.info({ jobId: job.id, companyId: user.id, status: job.status }, 'job posted');

  return job.id;
}

export async function updateJob(jobId: string, input: z.infer<typeof Input>): Promise<void> {
  const user = await requireRole('COMPANY');

  const rl = await postJobLimit(user.id);
  if (!rl.success) throw new Error('Daily job-posting limit reached. Try again tomorrow.');

  const parsed = Input.parse(input);

  // Tenancy: the job must belong to this company. Title/description/
  // requirements are pulled to detect JD-text changes for the embedding
  // refresh below.
  const existing = await db.jobPost.findFirst({
    where: { id: jobId, companyId: user.id, deletedAt: null },
    select: {
      id: true,
      publishedAt: true,
      title: true,
      description: true,
      requirements: true,
      chatArea: { select: { id: true } },
    },
  });
  if (!existing) throw new AuthError('FORBIDDEN');

  // JOB_UC_11.0: only gate when this update would actually create the area.
  if (parsed.createChatArea && !existing.chatArea) assertPlan(user, 'PRO');

  const duplicate = await db.jobPost.findFirst({
    where: {
      companyId: user.id,
      deletedAt: null,
      title: { equals: parsed.title, mode: 'insensitive' },
      id: { not: jobId },
    },
    select: { id: true },
  });
  if (duplicate) throw new Error('You already have a job post with this title.');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'JOB_UPDATED',
      entity: 'job_post',
      entityId: jobId,
      after: (j) => ({ id: j.id, status: j.status, title: j.title }),
    },
    (tx) =>
      tx.jobPost.update({
        where: { id: existing.id },
        data: {
          title: parsed.title,
          description: parsed.description,
          requirements: parsed.requirements || null,
          industry: parsed.industry,
          jobType: parsed.jobType,
          experienceLevel: parsed.experienceLevel,
          workMode: parsed.workMode,
          location: parsed.location || null,
          salaryMin: parsed.salaryMin,
          salaryMax: parsed.salaryMax,
          salaryCurrency: parsed.salaryCurrency,
          applicationDeadline: parsed.applicationDeadline
            ? new Date(parsed.applicationDeadline)
            : null,
          status: parsed.publish ? 'PUBLISHED' : 'DRAFT',
          // First publish stamps publishedAt; keep the original on re-saves. The
          // slug is left unchanged to preserve SEO + inbound links.
          publishedAt: parsed.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
          // Toggling the box on later creates the area; existing areas (and
          // their messages) are never deleted from here.
          ...(parsed.createChatArea && !existing.chatArea
            ? {
                chatArea: {
                  create: {
                    kind: 'JOB' as const,
                    companyId: user.id,
                    title: parsed.title,
                    participants: { create: { userId: user.id } },
                  },
                },
              }
            : {}),
        },
      }),
  );

  // The stored embedding is derived from these three fields — refresh it only
  // when one of them actually changed (embedJobPost skips existing embeddings
  // unless forced; there is no stored text hash, so the diff happens here).
  const jdTextChanged =
    parsed.title !== existing.title ||
    parsed.description !== existing.description ||
    (parsed.requirements || null) !== existing.requirements;

  // Off the response path (after(), not floating promises — see postJob):
  // re-extract skills, reindex, and refresh the JD embedding when the job is
  // published. Best-effort: failures are logged + sent to Sentry.
  after(async () => {
    try {
      await extractAndLinkSkills(
        jobId,
        parsed.title,
        parsed.description,
        parsed.requirements ?? '',
      );
    } catch (err) {
      logger.warn({ err, jobId }, 'JD skill re-extraction failed (non-blocking)');
      Sentry.captureException(err, { tags: { jobId } });
    }
    try {
      await reindexJob(jobId);
    } catch (err) {
      logger.warn({ err, jobId }, 'Algolia reindex failed (non-blocking)');
      Sentry.captureException(err, { tags: { jobId } });
    }
    if (parsed.publish) {
      try {
        await embedJobPost(jobId, { force: jdTextChanged });
      } catch (err) {
        logger.warn({ err, jobId }, 'JD embedding refresh failed (non-blocking)');
        Sentry.captureException(err, { tags: { jobId } });
      }
    }
  });

  updateTag(tags.job(jobId));
  updateTag(tags.jobs());
  updateTag(tags.company(user.id));

  logger.info({ jobId, companyId: user.id }, 'job updated');
}

// JOB_UC_11.1: remove a job post the company no longer needs. Soft-delete
// (deletedAt + ARCHIVED), matching the pattern used everywhere else in this
// app — applications, chat history, and audit trail are preserved, just
// hidden from listings and search.
export async function archiveJob(jobId: string): Promise<void> {
  const user = await requireRole('COMPANY');

  const existing = await db.jobPost.findFirst({
    where: { id: jobId, companyId: user.id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) throw new AuthError('FORBIDDEN');

  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = h.get('user-agent') ?? null;

  await withAudit(
    { actorId: user.id, ip, ua },
    {
      action: 'JOB_DELETED',
      entity: 'job_post',
      entityId: jobId,
      after: () => ({ status: 'ARCHIVED' }),
    },
    (tx) =>
      tx.jobPost.update({
        where: { id: jobId },
        data: { status: 'ARCHIVED', deletedAt: new Date() },
      }),
  );

  // Off the response path (after(), not a floating promise — see postJob).
  // reindexJob sees the ARCHIVED status and deletes the Algolia record.
  after(async () => {
    try {
      await reindexJob(jobId);
    } catch (err) {
      logger.warn({ err, jobId }, 'Algolia deindex failed (non-blocking)');
      Sentry.captureException(err, { tags: { jobId } });
    }
  });

  updateTag(tags.job(jobId));
  updateTag(tags.jobs());
  updateTag(tags.company(user.id));

  logger.info({ jobId, companyId: user.id }, 'job archived');
}

async function extractAndLinkSkills(
  jobId: string,
  title: string,
  description: string,
  requirements: string,
): Promise<void> {
  const text = `${title}\n\n${description}\n\n${requirements}`.slice(0, 30_000);

  const { object } = await generateObject({
    model: gateway(MODELS.haiku),
    schema: JdSkillsSchema,
    system: JD_SKILLS_SYSTEM,
    prompt: text,
    temperature: 0,
  });

  // Match against canonical Skill catalog; ignore unknown ones rather than
  // creating dups — admin can curate new entries later.
  const allSlugs = [...object.requiredSkills, ...object.niceToHave].map((s) =>
    s
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, ''),
  );

  const skills = await db.skill.findMany({ where: { slug: { in: allSlugs } } });
  const requiredSlugs = new Set(
    object.requiredSkills.map((s) =>
      s
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, ''),
    ),
  );

  // Reset this job's skill links, then add the freshly-extracted set — keeps
  // edits idempotent (skills from a previous description are cleared).
  await db.jobPostSkill.deleteMany({ where: { jobPostId: jobId } });
  if (skills.length > 0) {
    await db.jobPostSkill.createMany({
      data: skills.map((skill) => ({
        jobPostId: jobId,
        skillId: skill.id,
        weight: requiredSlugs.has(skill.slug) ? 2 : 1,
      })),
      skipDuplicates: true,
    });
  }
}
