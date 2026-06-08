// Vercel Workflow: daily digest emails.
//
// Triggered by Vercel Cron at 08:00 UTC. For each active user with a public
// profile or saved searches, picks the top-N new matches since the last
// digest and sends a single Resend email.
//
// V1 scope keeps this simple:
//   - jobseekers: top 5 new jobs in the last 24h matching their headline +
//     skills (Algolia search keyed on profile skills)
//   - companies: count of new applicants per open job
//   - one email per user, idempotent (last_digest_at watermark)
//
// Saved-search alerts with diff are V1.5.

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { logger } from '@/lib/observability/logger';
import { savedSearchWhere } from '@/lib/search/saved-search';

const SINCE_HOURS = 24;

const jobInclude = { company: { include: { companyProfile: true } } } satisfies Prisma.JobPostInclude;

// Jobs to surface to one jobseeker: new matches across their saved searches
// (each since its own watermark), else the generic "new in the last 24h".
async function digestJobsFor(userId: string, since: Date) {
  const searches = await db.savedSearch.findMany({
    where: { userId },
    select: { query: true, lastNotifiedAt: true },
  });

  if (searches.length === 0) {
    return db.jobPost.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gte: since }, deletedAt: null },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      include: jobInclude,
    });
  }

  const lists = await Promise.all(
    searches.map((s) =>
      db.jobPost.findMany({
        where: {
          AND: [
            savedSearchWhere(s.query),
            { status: 'PUBLISHED', deletedAt: null, publishedAt: { gte: s.lastNotifiedAt ?? since } },
          ],
        },
        orderBy: { publishedAt: 'desc' },
        take: 5,
        include: jobInclude,
      }),
    ),
  );
  await db.savedSearch.updateMany({ where: { userId }, data: { lastNotifiedAt: new Date() } });

  const seen = new Set<string>();
  return lists
    .flat()
    .filter((j) => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    })
    .slice(0, 5);
}

export async function runDigest(): Promise<{ sent: number; skipped: number }> {
  const since = new Date(Date.now() - SINCE_HOURS * 3600 * 1000);

  const jobseekers = await db.user.findMany({
    where: {
      userType: 'JOB_SEEKER',
      deletedAt: null,
      consentJson: { not: Prisma.DbNull },
      emailSuppressedAt: null,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      jobSeekerProfile: { select: { headline: true } },
    },
    take: 5000,
  });

  let sent = 0;
  let skipped = 0;

  for (const user of jobseekers) {
    const newJobs = await digestJobsFor(user.id, since);

    if (newJobs.length === 0) {
      skipped++;
      continue;
    }

    try {
      await resend().emails.send({
        from: EMAIL_FROM,
        to: user.email,
        subject: `${newJobs.length} new jobs for you on Joblify`,
        text: textBody(user.firstName ?? user.email, newJobs),
        html: htmlBody(user.firstName ?? user.email, newJobs),
      });
      sent++;
    } catch (err) {
      logger.warn({ err, userId: user.id }, 'digest email send failed');
      skipped++;
    }
  }

  return { sent, skipped };
}

function textBody(
  name: string,
  jobs: Array<{ slug: string; title: string; company: { companyProfile: { companyName: string } | null } }>,
): string {
  const lines = [
    `Hi ${name},`,
    '',
    'Here are the latest jobs that landed in the last day:',
    '',
    ...jobs.map(
      (j) =>
        `- ${j.title} at ${j.company.companyProfile?.companyName ?? 'a company'} — ${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/jobs/${j.slug}`,
    ),
    '',
    '— The Joblify team',
  ];
  return lines.join('\n');
}

function htmlBody(
  name: string,
  jobs: Array<{ slug: string; title: string; company: { companyProfile: { companyName: string } | null } }>,
): string {
  const items = jobs
    .map(
      (j) =>
        `<li><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/jobs/${j.slug}"><strong>${escape(j.title)}</strong></a> at ${escape(j.company.companyProfile?.companyName ?? 'a company')}</li>`,
    )
    .join('');
  return `<p>Hi ${escape(name)},</p>
<p>Here are the latest jobs that landed in the last day:</p>
<ul>${items}</ul>
<p>— The Joblify team</p>`;
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : '&#39;',
  );
}
