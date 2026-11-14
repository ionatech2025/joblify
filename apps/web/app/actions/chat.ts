'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { updateTag } from 'next/cache';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireUser, requireRole, assertPlan, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { withAudit } from '@/lib/audit';
import { tags } from '@/lib/cache';
import { chatMessageLimit } from '@/lib/ratelimit';
import { logger } from '@/lib/observability/logger';
import { type ActionResult, fail, succeed } from '@/lib/action-result';
import { clientIp } from '@/lib/security/client-ip';
import { CHAT_JOIN_STATUSES } from '@/lib/applications/transitions';

async function auditCtx(actorId: string) {
  const h = await headers();
  return {
    actorId,
    ip: clientIp(h),
    ua: h.get('user-agent') ?? null,
  };
}

// Open the job-specific chat area for one of the company's jobs, creating it
// on first use. Redirects into the area.
export async function openJobChatArea(jobPostId: string): Promise<void> {
  const user = await requireRole('COMPANY');
  assertPlan(user, 'PRO');

  const job = await db.jobPost.findFirst({
    where: { id: jobPostId, companyId: user.id, deletedAt: null },
    select: { id: true, title: true },
  });
  if (!job) throw new AuthError('FORBIDDEN');

  let area = await db.chatArea.findUnique({ where: { jobPostId: job.id }, select: { id: true } });
  if (!area) {
    try {
      area = await withAudit(
        await auditCtx(user.id),
        {
          action: 'CHAT_AREA_CREATED',
          entity: 'chat_area',
          after: (r) => ({ id: r.id, kind: 'JOB', jobPostId }),
        },
        (tx) =>
          tx.chatArea.create({
            data: {
              kind: 'JOB',
              companyId: user.id,
              jobPostId: job.id,
              title: job.title,
              participants: { create: { userId: user.id } },
            },
            select: { id: true },
          }),
      );
    } catch (err) {
      // Lost a race with a concurrent create — reuse the winner's area.
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
      area = await db.chatArea.findUnique({ where: { jobPostId: job.id }, select: { id: true } });
      if (!area) throw err;
    }
  }

  redirect(`/company/chats/${area.id}`);
}

// Open the company's single virtual-intern chat area, creating it on first
// use (flowchart: "create virtual intern chat area"). Redirects into it.
export async function openVirtualInternChatArea(): Promise<void> {
  const user = await requireRole('COMPANY');
  assertPlan(user, 'PRO');
  const area = await ensureVirtualInternChatArea(user.id);
  redirect(`/company/chats/${area.id}`);
}

async function ensureVirtualInternChatArea(companyUserId: string): Promise<{ id: string }> {
  const existing = await db.chatArea.findFirst({
    where: { companyId: companyUserId, kind: 'VIRTUAL_INTERN' },
    select: { id: true },
  });
  if (existing) return existing;

  const profile = await db.companyProfile.findUnique({
    where: { userId: companyUserId },
    select: { companyName: true },
  });

  try {
    return await withAudit(
      await auditCtx(companyUserId),
      {
        action: 'CHAT_AREA_CREATED',
        entity: 'chat_area',
        after: (r) => ({ id: r.id, kind: 'VIRTUAL_INTERN' }),
      },
      (tx) =>
        tx.chatArea.create({
          data: {
            kind: 'VIRTUAL_INTERN',
            companyId: companyUserId,
            title: `${profile?.companyName ?? 'Company'} · Virtual interns`,
            participants: { create: { userId: companyUserId } },
          },
          select: { id: true },
        }),
    );
  } catch (err) {
    // The partial unique index rejected a concurrent duplicate — reuse it.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')) throw err;
    const winner = await db.chatArea.findFirst({
      where: { companyId: companyUserId, kind: 'VIRTUAL_INTERN' },
      select: { id: true },
    });
    if (!winner) throw err;
    return winner;
  }
}

const NOT_SHORTLISTED = "Only candidates you've shortlisted for this job can join its chat area.";

class NoChatSeatError extends Error {}

async function lockChatEligibleApplication(
  tx: Prisma.TransactionClient,
  jobPostId: string | null,
  jobSeekerId: string,
): Promise<boolean> {
  const rows = await tx.$queryRaw<{ id: string }[]>`
    SELECT id FROM job_applications
     WHERE "jobPostId" = ${jobPostId}::uuid
       AND "jobSeekerId" = ${jobSeekerId}::uuid
       AND status::text IN (${Prisma.join(CHAT_JOIN_STATUSES)})
       FOR UPDATE`;
  return rows.length > 0;
}

// Add a job seeker to one of the company's chat areas (flowchart: "add seeker
// of choice to job specific chat area" / "add virtual interns of interest").
// JOB_UC_14.0: both add-to-job-chat and add-to-VI-chat are premium outreach
// actions (addVirtualInternToChat below delegates here, so gating once here
// covers both entry points).
export async function addChatParticipant(
  chatAreaId: string,
  jobSeekerUserId: string,
): Promise<ActionResult> {
  const user = await requireRole('COMPANY');
  assertPlan(user, 'PRO');

  const area = await db.chatArea.findFirst({
    where: { id: chatAreaId, companyId: user.id },
    select: { id: true, kind: true, title: true, jobPostId: true },
  });
  if (!area) throw new AuthError('FORBIDDEN');

  const profile = await db.companyProfile.findUnique({
    where: { userId: user.id },
    select: { verificationStatus: true },
  });
  if (profile?.verificationStatus && profile.verificationStatus !== 'VERIFIED') {
    return fail('Only verified companies can add participants to chat.');
  }

  const seeker = await db.user.findFirst({
    where: { id: jobSeekerUserId, userType: 'JOB_SEEKER', deletedAt: null },
    select: { id: true, jobSeekerProfile: { select: { profileType: true } } },
  });
  if (!seeker) return fail('Job seeker not found.');
  if (area.kind === 'VIRTUAL_INTERN' && seeker.jobSeekerProfile?.profileType !== 'VIRTUAL_INTERN') {
    return fail('Only virtual-intern profiles can join a virtual-intern chat area.');
  }
  if (area.kind === 'JOB') {
    const seat =
      area.jobPostId &&
      (await db.jobApplication.findFirst({
        where: {
          jobPostId: area.jobPostId,
          jobSeekerId: seeker.id,
          status: { in: [...CHAT_JOIN_STATUSES] },
        },
        select: { id: true },
      }));
    if (!seat) return fail(NOT_SHORTLISTED);
  }

  const already = await db.chatParticipant.findUnique({
    where: { chatAreaId_userId: { chatAreaId: area.id, userId: seeker.id } },
    select: { chatAreaId: true },
  });
  if (already) return succeed();

  try {
    await withAudit(
      await auditCtx(user.id),
      {
        action: 'CHAT_PARTICIPANT_ADDED',
        entity: 'chat_area',
        entityId: area.id,
        after: () => ({ userId: seeker.id }),
      },
      async (tx) => {
        if (
          area.kind === 'JOB' &&
          !(await lockChatEligibleApplication(tx, area.jobPostId, seeker.id))
        ) {
          throw new NoChatSeatError();
        }
        await tx.chatParticipant.create({ data: { chatAreaId: area.id, userId: seeker.id } });
        await tx.notification.create({
          data: {
            userId: seeker.id,
            kind: 'CHAT_AREA_ADDED',
            payload: {
              chatAreaId: area.id,
              message: `You were added to the chat area “${area.title}”.`,
            },
          },
        });
      },
    );
  } catch (err) {
    if (err instanceof NoChatSeatError) return fail(NOT_SHORTLISTED);
    throw err;
  }

  updateTag(tags.notifications(seeker.id));
  return succeed();
}

// Directory shortcut: put a virtual intern straight into the company's VI
// area, creating the area on first use.
export async function addVirtualInternToChat(jobSeekerUserId: string): Promise<ActionResult> {
  const user = await requireRole('COMPANY');
  assertPlan(user, 'PRO');
  const area = await ensureVirtualInternChatArea(user.id);
  return addChatParticipant(area.id, jobSeekerUserId);
}

const MessageSchema = z.object({
  body: z.string().trim().min(1, 'Message is empty.').max(4000),
  kind: z.enum(['TEXT', 'MATERIAL', 'INTERVIEW_DETAILS']).default('TEXT'),
  // https only, no user:pass@. `z.string().url()` alone accepts javascript:,
  // data:, ftp: and file: — fine to *store*, not fine to render as a link in a
  // hiring chat where a stranger's link is the classic phishing vector.
  attachmentUrl: z
    .string()
    .url()
    .max(2000)
    .refine((u) => {
      try {
        const p = new URL(u);
        return p.protocol === 'https:' && !p.username && !p.password;
      } catch {
        return false;
      }
    }, 'Attachment links must be https:// addresses.')
    .optional()
    .or(z.literal('')),
});

// Discriminated result for sendChatMessage so the composer can surface
// expected failures inline instead of losing the draft to an error boundary.
export type SendMessageResult = { ok: true } | { ok: false; error: string };

// Post a message into a chat area the caller belongs to. MATERIAL carries an
// attachment link; INTERVIEW_DETAILS flags interview logistics (flowchart:
// "share material, orient & communicate interview details"). Individual
// messages are not audited — like recruiter notes, the content is sensitive
// and the volume is high.
//
// Expected failures (rate limit, validation) return { ok: false } rather than
// throwing; unexpected ones (auth, DB) still throw. The prevState parameter
// exists so the composer can bind chatAreaId and hand the rest straight to
// useActionState.
export async function sendChatMessage(
  chatAreaId: string,
  _prevState: SendMessageResult | null,
  formData: FormData,
): Promise<SendMessageResult> {
  const user = await requireUser();

  const rl = await chatMessageLimit(user.id);
  if (!rl.success) {
    return { ok: false, error: 'You are sending messages too quickly. Please slow down.' };
  }

  const membership = await db.chatParticipant.findUnique({
    where: { chatAreaId_userId: { chatAreaId, userId: user.id } },
    select: { chatAreaId: true },
  });
  if (!membership) throw new AuthError('FORBIDDEN');

  const parsed = MessageSchema.safeParse({
    body: formData.get('body'),
    kind: formData.get('kind') ?? 'TEXT',
    attachmentUrl: formData.get('attachmentUrl') ?? '',
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'That message cannot be sent.' };
  }

  await db.$transaction([
    db.chatMessage.create({
      data: {
        chatAreaId,
        senderId: user.id,
        kind: parsed.data.kind,
        body: parsed.data.body,
        attachmentUrl: parsed.data.attachmentUrl || null,
      },
    }),
    // Bump so chat lists sort by latest activity.
    db.chatArea.update({ where: { id: chatAreaId }, data: { updatedAt: new Date() } }),
  ]);

  // Metadata only — message content is sensitive and high-volume, same
  // reasoning as the audit-trail exemption noted above.
  logger.info({ chatAreaId, senderId: user.id, kind: parsed.data.kind }, 'chat message sent');
  return { ok: true };
}
