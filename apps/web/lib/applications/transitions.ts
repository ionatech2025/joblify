import type { ApplicationStatus } from '@prisma/client';

/**
 * Who may move an application where.
 *
 * `updateApplicantStatus` used to accept any status for any application, so a
 * recruiter could set WITHDRAWN on a candidate's behalf, or "reopen" an
 * application the candidate had withdrawn (and notify them they were
 * shortlisted for a job they had walked away from). WITHDRAWN is the one state
 * that belongs to the candidate: they enter it (withdrawApplication) and
 * nobody else can enter or leave it.
 *
 * Everything else stays free-form between recruiter-controlled stages — hiring
 * teams legitimately skip stages and correct mis-clicks, and a rigid funnel
 * would just push them to the notes field.
 */
export const RECRUITER_STATUSES: readonly ApplicationStatus[] = [
  'SUBMITTED',
  'VIEWED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'OFFER_EXTENDED',
  'HIRED',
  'REJECTED',
];

export type TransitionCheck = { ok: true } | { ok: false; reason: string };

export function checkRecruiterTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): TransitionCheck {
  if (!RECRUITER_STATUSES.includes(to) && to !== 'WITHDRAWN') {
    return { ok: false, reason: 'That is not a valid application status.' };
  }
  if (to === 'WITHDRAWN') {
    return { ok: false, reason: 'Only the candidate can withdraw an application.' };
  }
  if (from === 'WITHDRAWN') {
    return {
      ok: false,
      reason: 'The candidate withdrew this application, so it cannot be changed.',
    };
  }
  return { ok: true };
}

export const CHAT_JOIN_STATUSES: readonly ApplicationStatus[] = [
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'OFFER_EXTENDED',
  'HIRED',
];

// The candidate acts on these emails, so moving off one is emailed even when the move is backward.
const OUTCOME_STATUSES: readonly ApplicationStatus[] = ['OFFER_EXTENDED', 'HIRED', 'REJECTED'];

export function emailsCandidate(from: ApplicationStatus, to: ApplicationStatus): boolean {
  if (to === 'REJECTED' || OUTCOME_STATUSES.includes(from)) return true;
  if (!CHAT_JOIN_STATUSES.includes(to)) return false;
  return RECRUITER_STATUSES.indexOf(to) > RECRUITER_STATUSES.indexOf(from);
}
