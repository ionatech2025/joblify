'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { requireUser, requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { logger } from '@/lib/observability/logger';
import {
  CompanyProfileSchema,
  type CompanyProfileInput,
} from '@/app/company/company-profile-schema';

function slugify(name: string): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 60) || 'company';
  return `${base}-${Math.random().toString(36).slice(2, 8)}`;
}

async function auditCtx() {
  const h = await headers();
  return {
    actorId: null as string | null,
    ip: h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    ua: h.get('user-agent') ?? null,
  };
}

// Self-serve: any authenticated user can create a company. This promotes them to
// userType=COMPANY and creates the CompanyProfile in one transaction. Returns
// nothing — the client redirects to /company/jobs.
export async function createCompanyProfile(input: CompanyProfileInput): Promise<void> {
  const user = await requireUser();
  const parsed = CompanyProfileSchema.parse(input);

  const existing = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) return; // already set up

  const ctx = { ...(await auditCtx()), actorId: user.id };

  const created = await withAudit(
    ctx,
    { action: 'COMPANY_PROFILE_UPDATED', entity: 'company_profile', after: (r) => ({ id: r.id }) },
    async (tx) => {
      await tx.user.update({ where: { id: user.id }, data: { userType: 'COMPANY' } });
      return tx.companyProfile.create({
        data: {
          userId: user.id,
          slug: slugify(parsed.companyName),
          companyName: parsed.companyName,
          industry: parsed.industry,
          companySize: parsed.companySize,
          description: parsed.description,
          website: parsed.website || null,
          linkedin: parsed.linkedin || null,
        },
        select: { id: true },
      });
    },
  );

  logger.info({ userId: user.id, companyProfileId: created.id }, 'company profile created');
}

export async function updateCompanyProfile(input: CompanyProfileInput): Promise<void> {
  const user = await requireRole('COMPANY');
  const parsed = CompanyProfileSchema.parse(input);

  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (!profile) throw new AuthError('FORBIDDEN');

  const ctx = { ...(await auditCtx()), actorId: user.id };

  await withAudit(
    ctx,
    {
      action: 'COMPANY_PROFILE_UPDATED',
      entity: 'company_profile',
      entityId: profile.id,
      after: () => parsed,
    },
    (tx) =>
      tx.companyProfile.update({
        where: { id: profile.id },
        data: {
          companyName: parsed.companyName,
          industry: parsed.industry,
          companySize: parsed.companySize,
          description: parsed.description,
          website: parsed.website || null,
          linkedin: parsed.linkedin || null,
        },
      }),
  );

  updateTag(tags.company(user.id));

  logger.info({ userId: user.id, companyProfileId: profile.id }, 'company profile updated');
}
