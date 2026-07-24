// Daily digest emails. Plain inline function driven by Vercel Cron at
// 08:00 UTC (app/api/v1/cron/digest-email) — no durable-execution runtime;
// resumability comes from the `User.lastDigestAt` watermark below.
//
// How a run actually works:
//   1. The generic "new in the last 24h" job list is computed ONCE per run,
//      not once per user.
//   2. Eligible jobseekers (consented, non-suppressed, non-deleted) whose
//      `lastDigestAt` watermark is null or older than the eligibility cutoff
//      are selected oldest-watermark-first in pages of PAGE_SIZE. No fixed
//      overall cap: the watermark itself is the cursor — processed users drop
//      out of the selection, so each page query returns the next unprocessed
//      slice.
//   3. Each page is sent in Promise.allSettled chunks of CHUNK_SIZE. Right
//      after a chunk settles, every processed user's lastDigestAt (and, for
//      saved-search users, SavedSearch.lastNotifiedAt) is stamped in one
//      updateMany — so an interrupted run double-sends at most the in-flight
//      chunk, and the next run resumes where this one stopped.
//   4. Users with saved searches get a personalized list (each search diffed
//      since its own lastNotifiedAt); everyone else shares the generic list.
//   5. The run stops cleanly at the caller-provided wall-clock deadline
//      (~80% of the route's maxDuration) and logs progress.

import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nextjs';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { logger } from '@/lib/observability/logger';
import { savedSearchWhere } from '@/lib/search/saved-search';

const SINCE_HOURS = 24;
// Successive daily runs stamp watermarks a few minutes AFTER the cron's
// scheduled time, so an exact 24h eligibility comparison would skip everyone
// every other day. Padding the cutoff keeps daily cadence while still
// excluding already-processed users on a same-day re-run.
const ELIGIBILITY_SLACK_HOURS = 2;
const PAGE_SIZE = 200;
const CHUNK_SIZE = 25;
const JOBS_PER_EMAIL = 5;

const jobInclude = { company: { include: { companyProfile: true } } } satisfies Prisma.JobPostInclude;

type DigestJob = Prisma.JobPostGetPayload<{ include: typeof jobInclude }>;
type DigestUser = { id: string; email: string; firstName: string | null };
type SavedSearchLite = { query: string; lastNotifiedAt: Date | null };

export type DigestSummary = { sent: number; skipped: number; failed: number; stoppedEarly: boolean };

// Jobs to surface to one jobseeker: new matches across their saved searches
// (each since its own watermark), else the shared generic list computed once
// for the whole run.
async function digestJobsFor(
  searches: SavedSearchLite[],
  since: Date,
  genericJobs: DigestJob[],
): Promise<DigestJob[]> {
  if (searches.length === 0) return genericJobs;

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
        take: JOBS_PER_EMAIL,
        include: jobInclude,
      }),
    ),
  );

  const seen = new Set<string>();
  return lists
    .flat()
    .filter((j) => {
      if (seen.has(j.id)) return false;
      seen.add(j.id);
      return true;
    })
    .slice(0, JOBS_PER_EMAIL);
}

// 'sent' when an email went out, 'skipped' when there was nothing new to
// send. Throws on send failure so the chunk's allSettled marks it rejected
// and the user's watermark is NOT stamped (retried next run).
async function processUser(
  user: DigestUser,
  searches: SavedSearchLite[],
  since: Date,
  genericJobs: DigestJob[],
): Promise<'sent' | 'skipped'> {
  const newJobs = await digestJobsFor(searches, since, genericJobs);
  if (newJobs.length === 0) return 'skipped';

  await resend().emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: `${newJobs.length} new jobs for you on Joblify`,
    text: textBody(user.firstName ?? user.email, newJobs),
    html: htmlBody(user.firstName ?? user.email, newJobs),
  });
  return 'sent';
}

export async function runDigest({ deadlineMs = 240_000 }: { deadlineMs?: number } = {}): Promise<DigestSummary> {
  const runStart = Date.now();
  const deadline = runStart + deadlineMs;
  const since = new Date(runStart - SINCE_HOURS * 3600 * 1000);
  const eligibleBefore = new Date(runStart - (SINCE_HOURS - ELIGIBILITY_SLACK_HOURS) * 3600 * 1000);

  // The generic 24h list — computed once, shared by every user without saved
  // searches.
  const genericJobs = await db.jobPost.findMany({
    where: { status: 'PUBLISHED', publishedAt: { gte: since }, deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: JOBS_PER_EMAIL,
    include: jobInclude,
  });

  const eligibility = {
    userType: 'JOB_SEEKER',
    deletedAt: null,
    consentJson: { not: Prisma.DbNull },
    emailSuppressedAt: null,
    OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: eligibleBefore } }],
  } satisfies Prisma.UserWhereInput;

  const eligibleTotal = await db.user.count({ where: eligibility });

  const s: DigestSummary = { sent: 0, skipped: 0, failed: 0, stoppedEarly: false };
  // Send failures keep their stale watermark (so the NEXT run retries them)
  // but must be excluded from this run's later pages or the loop would spin
  // on them. Bounded by this run's failure count.
  const failedIds: string[] = [];

  pages: while (true) {
    if (Date.now() > deadline) {
      s.stoppedEarly = true;
      break;
    }

    const page = await db.user.findMany({
      where: failedIds.length > 0 ? { ...eligibility, id: { notIn: failedIds } } : eligibility,
      select: { id: true, email: true, firstName: true },
      orderBy: [{ lastDigestAt: { sort: 'asc', nulls: 'first' } }, { id: 'asc' }],
      take: PAGE_SIZE,
    });
    if (page.length === 0) break;

    // One query for the whole page's saved searches instead of one per user.
    const pageSearches = await db.savedSearch.findMany({
      where: { userId: { in: page.map((u) => u.id) } },
      select: { userId: true, query: true, lastNotifiedAt: true },
    });
    const searchesByUser = new Map<string, SavedSearchLite[]>();
    for (const search of pageSearches) {
      const list = searchesByUser.get(search.userId) ?? [];
      list.push({ query: search.query, lastNotifiedAt: search.lastNotifiedAt });
      searchesByUser.set(search.userId, list);
    }

    for (let i = 0; i < page.length; i += CHUNK_SIZE) {
      if (Date.now() > deadline) {
        s.stoppedEarly = true;
        break pages;
      }
      const chunk = page.slice(i, i + CHUNK_SIZE);
      const results = await Promise.allSettled(
        chunk.map((user) => processUser(user, searchesByUser.get(user.id) ?? [], since, genericJobs)),
      );

      const processedIds: string[] = [];
      results.forEach((result, idx) => {
        const user = chunk[idx]!;
        if (result.status === 'fulfilled') {
          processedIds.push(user.id);
          if (result.value === 'sent') s.sent++;
          else s.skipped++;
        } else {
          s.failed++;
          failedIds.push(user.id);
          logger.warn({ err: result.reason, userId: user.id }, 'digest email send failed');
          Sentry.captureException(result.reason, { tags: { userId: user.id } });
        }
      });

      // Stamp watermarks per chunk, immediately after it settles — not one
      // bulk update at the end — so a crash loses at most the in-flight
      // chunk. Failed sends are deliberately left unstamped.
      if (processedIds.length > 0) {
        const now = new Date();
        await db.user.updateMany({ where: { id: { in: processedIds } }, data: { lastDigestAt: now } });
        await db.savedSearch.updateMany({
          where: { userId: { in: processedIds } },
          data: { lastNotifiedAt: now },
        });
      }
    }
  }

  const processed = s.sent + s.skipped + s.failed;
  if (s.stoppedEarly) {
    logger.warn(
      { ...s, eligibleTotal, remainingEstimate: Math.max(0, eligibleTotal - processed) },
      'digest run stopped at the wall-clock deadline; the watermark resumes it next run',
    );
  } else {
    logger.info({ ...s, eligibleTotal }, 'digest run complete');
  }

  return s;
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
