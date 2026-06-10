'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import type { z } from 'zod';
import { generateObject } from 'ai';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { JdSkillsSchema, JD_SKILLS_SYSTEM } from '@/lib/ai/prompts/jd-skills';
import { reindexJob } from '@/lib/search/index-job';
import { logger } from '@/lib/observability/logger';
import { PostJobFormSchema } from '../company/jobs/job-form-fields';

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
  const parsed = Input.parse(input);

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
          applicationDeadline: parsed.applicationDeadline ? new Date(parsed.applicationDeadline) : null,
          status: parsed.publish ? 'PUBLISHED' : 'DRAFT',
          publishedAt: parsed.publish ? new Date() : null,
        },
      }),
  );

  // AI skill extraction (inline, best-effort).
  extractAndLinkSkills(job.id, parsed.title, parsed.description, parsed.requirements ?? '').catch((err) =>
    logger.warn({ err, jobId: job.id }, 'JD skill extraction failed (non-blocking)'),
  );

  // Push to Algolia (best-effort).
  reindexJob(job.id).catch((err) =>
    logger.warn({ err, jobId: job.id }, 'Algolia index push failed (non-blocking)'),
  );

  updateTag(tags.jobs());
  updateTag(tags.company(user.id));

  return job.id;
}

export async function updateJob(jobId: string, input: z.infer<typeof Input>): Promise<void> {
  const user = await requireRole('COMPANY');
  const parsed = Input.parse(input);

  // Tenancy: the job must belong to this company.
  const existing = await db.jobPost.findFirst({
    where: { id: jobId, companyId: user.id, deletedAt: null },
    select: { id: true, publishedAt: true },
  });
  if (!existing) throw new AuthError('FORBIDDEN');

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
          applicationDeadline: parsed.applicationDeadline ? new Date(parsed.applicationDeadline) : null,
          status: parsed.publish ? 'PUBLISHED' : 'DRAFT',
          // First publish stamps publishedAt; keep the original on re-saves. The
          // slug is left unchanged to preserve SEO + inbound links.
          publishedAt: parsed.publish ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
        },
      }),
  );

  // Re-extract skills + reindex (best-effort, never block the save).
  extractAndLinkSkills(jobId, parsed.title, parsed.description, parsed.requirements ?? '').catch((err) =>
    logger.warn({ err, jobId }, 'JD skill re-extraction failed (non-blocking)'),
  );
  reindexJob(jobId).catch((err) => logger.warn({ err, jobId }, 'Algolia reindex failed (non-blocking)'));

  updateTag(tags.job(jobId));
  updateTag(tags.jobs());
  updateTag(tags.company(user.id));
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
    s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
  );

  const skills = await db.skill.findMany({ where: { slug: { in: allSlugs } } });
  const requiredSlugs = new Set(
    object.requiredSkills.map((s) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')),
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
