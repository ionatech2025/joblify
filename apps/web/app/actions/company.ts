'use server';

import { headers } from 'next/headers';
import { updateTag } from 'next/cache';
import { requireUser, requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { trustedLogoUrl } from '@/lib/storage/blob';
import { logger } from '@/lib/observability/logger';
import {
  CompanyProfileSchema,
  type CompanyProfileInput,
} from '@/app/company/company-profile-schema';
import { clientIp } from '@/lib/security/client-ip';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

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
    ip: clientIp(h),
    ua: h.get('user-agent') ?? null,
  };
}

export async function createCompanyProfile(input: CompanyProfileInput): Promise<ActionResult> {
  const user = await requireUser();
  const result = CompanyProfileSchema.safeParse(input);
  if (!result.success) return fail(result.error.issues[0]?.message ?? 'Check the company details.');
  const parsed = result.data;

  const existing = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true },
  });
  if (existing) return fail('A company profile already exists for this account.');

  // Check for duplicate company name (JOB_UC_01.1 / JOB_UC_05.1)
  const duplicateName = await db.companyProfile.findFirst({
    where: {
      companyName: { equals: parsed.companyName, mode: 'insensitive' },
    },
    select: { id: true },
  });
  if (duplicateName) return fail('A company with this name is already registered.');

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
          // Only a logo that is actually in our store — never a typed-in URL.
          logoUrl: trustedLogoUrl(parsed.logoUrl, user.id),
        },
        select: { id: true },
      });
    },
  );

  logger.info({ userId: user.id, companyProfileId: created.id }, 'company profile created');
  return succeed();
}

class StatusChanged extends Error {}

export async function updateCompanyProfile(input: CompanyProfileInput): Promise<ActionResult> {
  const user = await requireRole('COMPANY');
  const result = CompanyProfileSchema.safeParse(input);
  if (!result.success) return fail(result.error.issues[0]?.message ?? 'Check the company details.');
  const parsed = result.data;

  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, logoUrl: true, companyName: true, website: true, verificationStatus: true },
  });
  if (!profile) throw new AuthError('FORBIDDEN');

  if (
    profile.verificationStatus === 'VERIFIED' &&
    (parsed.companyName !== profile.companyName || (parsed.website || null) !== profile.website)
  ) {
    return fail(
      "Company name and website can't be changed once verified. The verified badge vouches for them.",
    );
  }
  const resubmission =
    profile.verificationStatus === 'REJECTED'
      ? { verificationStatus: 'PENDING' as const, rejectionReason: null }
      : {};

  // '' clears the logo; a value must already be ours (uploadLogoDirect is the
  // only thing that mints one). A foreign URL is ignored rather than stored —
  // and rather than wiping the logo the company already has.
  const trustedLogo = trustedLogoUrl(parsed.logoUrl, user.id, profile.logoUrl);
  const logoPatch =
    parsed.logoUrl === undefined
      ? {}
      : parsed.logoUrl === ''
        ? { logoUrl: null }
        : trustedLogo !== null
          ? { logoUrl: trustedLogo }
          : {};

  const duplicateName = await db.companyProfile.findFirst({
    where: {
      companyName: { equals: parsed.companyName, mode: 'insensitive' },
      id: { not: profile.id },
    },
    select: { id: true },
  });
  if (duplicateName) return fail('A company with this name is already registered.');

  const ctx = { ...(await auditCtx()), actorId: user.id };

  try {
    await withAudit(
      ctx,
      {
        action: 'COMPANY_PROFILE_UPDATED',
        entity: 'company_profile',
        entityId: profile.id,
        before: { verificationStatus: profile.verificationStatus },
        after: () => ({ ...parsed, ...resubmission }),
      },
      async (tx) => {
        // The lock and resubmit rules above were decided for the status we
        // read; an admin decision since then must not let this write through.
        const { count } = await tx.companyProfile.updateMany({
          where: { id: profile.id, verificationStatus: profile.verificationStatus },
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
            ...logoPatch,
            ...resubmission,
          },
        });
        if (count === 0) throw new StatusChanged();
        if (parsed.phone) {
          await tx.user.update({
            where: { id: user.id },
            data: { phone: parsed.phone },
          });
        }
      },
    );
  } catch (err) {
    if (err instanceof StatusChanged) {
      return fail(
        'Your verification status changed while you were editing. Reload the page and try again.',
      );
    }
    throw err;
  }

  updateTag(tags.company(user.id));
  updateTag(tags.companies());

  logger.info({ userId: user.id, companyProfileId: profile.id }, 'company profile updated');
  return succeed();
}
