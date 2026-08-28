'use server';

import { z } from 'zod';
import { requireRole, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { defaultSearchLabel } from '@/lib/search/saved-search';
import { logger } from '@/lib/observability/logger';
import { type ActionResult, fail, succeed } from '@/lib/action-result';

const SaveSchema = z.object({
  query: z.string().max(2000),
  label: z.string().max(120).optional(),
});

export async function saveSearch(input: { query: string; label?: string }): Promise<ActionResult> {
  const user = await requireRole('JOB_SEEKER');
  const parsed = SaveSchema.parse(input);
  const query = parsed.query.replace(/^\?+/, '').trim();
  const label = (parsed.label?.trim() || defaultSearchLabel(query)).slice(0, 120);

  // Cap per user so the daily digest stays bounded.
  const count = await db.savedSearch.count({ where: { userId: user.id } });
  if (count >= 20) return fail('You can save up to 20 searches.');

  await db.savedSearch.create({ data: { userId: user.id, label, query } });

  logger.info({ userId: user.id }, 'saved search created');
  return succeed();
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const user = await requireRole('JOB_SEEKER');
  // Tenancy: only your own.
  const existing = await db.savedSearch.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) throw new AuthError('FORBIDDEN');
  await db.savedSearch.delete({ where: { id: existing.id } });

  logger.info({ userId: user.id, savedSearchId: existing.id }, 'saved search deleted');
}
