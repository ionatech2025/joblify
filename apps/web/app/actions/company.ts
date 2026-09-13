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
  if (existing) {
    throw new Error('A company profile already exists for this account.');
  }

  // Check for duplicate company name (JOB_UC_01.1 / JOB_UC_05.1)
  const duplicateName = await db.companyProfile.findFirst({
    where: {
      companyName: { equals: parsed.companyName, mode: 'insensitive' },
    },
    select: { id: true },
  });
  if (duplicateName) {
    throw new Error('A company with this name is already registered.');
  }

  const ctx = { ...(await auditCtx()), actorId: user.id };

  const created = await withAudit(
    ctx,
    { action: 'COMPANY_PROFILE_UPDATED', entity: 'company_profile', after: (r) => ({ id: r.id }) },
    async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          userType: 'COMPANY',
          ...(parsed.phone ? { phone: parsed.phone } : {}),
        },
      });
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
          address: parsed.address || null,
          contactPersonName: parsed.contactPersonName || null,
          contactPersonPosition: parsed.contactPersonPosition || null,
          logoUrl: parsed.logoUrl || null,
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

  const duplicateName = await db.companyProfile.findFirst({
    where: {
      companyName: { equals: parsed.companyName, mode: 'insensitive' },
      id: { not: profile.id },
    },
    select: { id: true },
  });
  if (duplicateName) {
    throw new Error('A company with this name is already registered.');
  }

  const ctx = { ...(await auditCtx()), actorId: user.id };

  await withAudit(
    ctx,
    {
      action: 'COMPANY_PROFILE_UPDATED',
      entity: 'company_profile',
      entityId: profile.id,
      after: () => parsed,
    },
    async (tx) => {
      await tx.companyProfile.update({
        where: { id: profile.id },
        data: {
          companyName: parsed.companyName,
          industry: parsed.industry,
          companySize: parsed.companySize,
          description: parsed.description,
          website: parsed.website || null,
          linkedin: parsed.linkedin || null,
          address: parsed.address || null,
          contactPersonName: parsed.contactPersonName || null,
          contactPersonPosition: parsed.contactPersonPosition || null,
          ...(parsed.logoUrl !== undefined ? { logoUrl: parsed.logoUrl || null } : {}),
        },
      });
      if (parsed.phone) {
        await tx.user.update({
          where: { id: user.id },
          data: { phone: parsed.phone },
        });
      }
    },
  );

  updateTag(tags.company(user.id));
  updateTag(tags.companies());

  logger.info({ userId: user.id, companyProfileId: profile.id }, 'company profile updated');
}
