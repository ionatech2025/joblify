'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import type { z } from 'zod';
import { generateObject } from 'ai';
import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { gateway, MODELS } from '@/lib/ai/gateway';
import { JdSkillsSchema, JD_SKILLS_SYSTEM } from '@/lib/ai/prompts/jd-skills';
import { reindexJob } from '@/lib/search/index-job';
import { logger } from '@/lib/observability/logger';
import { PostJobFormSchema } from '../company/jobs/new/post-job-form';

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

  for (const skill of skills) {
    await db.jobPostSkill.upsert({
      where: { jobPostId_skillId: { jobPostId: jobId, skillId: skill.id } },
      create: { jobPostId: jobId, skillId: skill.id, weight: requiredSlugs.has(skill.slug) ? 2 : 1 },
      update: { weight: requiredSlugs.has(skill.slug) ? 2 : 1 },
    });
  }
}
