'use server';

import { requireRole } from '@/lib/auth';
import { db } from '@/lib/db';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

// Toggle a saved (bookmarked) job for the current jobseeker. Returns the new
// state so the client can reflect it. Low-stakes bookmark — not audit-wrapped.
//
// Both writes tolerate a concurrent request for the same job (a double click,
// two tabs): the end state is the one asked for, so neither throws.
export async function toggleSavedJob(jobPostId: string): Promise<ActionResult<{ saved: boolean }>> {
  const user = await requireRole('JOB_SEEKER');

  const existing = await db.savedJob.findUnique({
    where: { userId_jobPostId: { userId: user.id, jobPostId } },
    select: { id: true },
  });

  if (existing) {
    await db.savedJob.deleteMany({ where: { id: existing.id } });
    return succeed({ saved: false });
  }

  // Only allow saving a real, live job.
  const job = await db.jobPost.findFirst({
    where: { id: jobPostId, status: 'PUBLISHED', deletedAt: null },
    select: { id: true },
  });
  if (!job) return fail('Job not available.');

  await db.savedJob.createMany({ data: [{ userId: user.id, jobPostId }], skipDuplicates: true });
  return succeed({ saved: true });
}
