import type { ApplicationStatus, ChatMessageKind, JobPostStatus } from '@prisma/client';

/**
 * Every enum → human label → semantic Badge tone mapping in one place.
 *
 * These used to live as five private consts scattered across the surfaces that
 * happened to need them (the applications list, the applicants board, the chat
 * thread, the company jobs table, the edit page), which is how the same status
 * ends up a different colour on two screens. Badge tone names come from
 * app/components/ui/badge.tsx.
 */
export type StatusTone = 'success' | 'warn' | 'danger' | 'neutral' | 'brand' | 'info';

// --- Job posts -------------------------------------------------------------

export const JOB_STATUS_LABEL: Record<JobPostStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

export const JOB_STATUS_TONE: Record<JobPostStatus, StatusTone> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warn',
  PUBLISHED: 'success',
  CLOSED: 'neutral',
  ARCHIVED: 'neutral',
};

// --- Applications ----------------------------------------------------------

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Submitted',
  VIEWED: 'Viewed',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  OFFER_EXTENDED: 'Offer extended',
  HIRED: 'Hired',
  REJECTED: 'Not selected',
  WITHDRAWN: 'Withdrawn',
};

// Forward progress and wins read as success; a rejection is a definite negative
// outcome (danger), and a withdrawal is neither (neutral).
export const APPLICATION_STATUS_TONE: Record<ApplicationStatus, StatusTone> = {
  SUBMITTED: 'neutral',
  VIEWED: 'info',
  SHORTLISTED: 'success',
  INTERVIEW_SCHEDULED: 'success',
  OFFER_EXTENDED: 'success',
  HIRED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
};

/** Pipeline column order for the applicants board. */
export const APPLICATION_STAGES: { status: ApplicationStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'New' },
  { status: 'VIEWED', label: 'Viewed' },
  { status: 'SHORTLISTED', label: 'Shortlisted' },
  { status: 'INTERVIEW_SCHEDULED', label: 'Interview' },
  { status: 'OFFER_EXTENDED', label: 'Offer' },
  { status: 'HIRED', label: 'Hired' },
  { status: 'REJECTED', label: 'Rejected' },
  { status: 'WITHDRAWN', label: 'Withdrawn' },
];

/** Terminal stages — hidden behind the board's "show closed" toggle. */
export const CLOSED_APPLICATION_STATUSES: ApplicationStatus[] = ['HIRED', 'REJECTED', 'WITHDRAWN'];

// The applications API serialises status as a plain string, so these accept one
// and fall back rather than forcing a cast at every call site.
export function applicationStatusLabel(status: string): string {
  return APPLICATION_STATUS_LABEL[status as ApplicationStatus] ?? status;
}

export function applicationStatusTone(status: string): StatusTone {
  return APPLICATION_STATUS_TONE[status as ApplicationStatus] ?? 'neutral';
}

// --- Match score -----------------------------------------------------------

/** Resume↔job match score (0–1) → tone. Thresholds: 70% strong, 50% partial. */
export function matchTone(score: number): StatusTone {
  const pct = Math.round(score * 100);
  return pct >= 70 ? 'success' : pct >= 50 ? 'warn' : 'neutral';
}

// --- Chat ------------------------------------------------------------------

export const CHAT_KIND_BADGE: Partial<
  Record<ChatMessageKind, { label: string; tone: StatusTone }>
> = {
  MATERIAL: { label: 'Material', tone: 'warn' },
  INTERVIEW_DETAILS: { label: 'Interview details', tone: 'success' },
};

// --- Shared chip style ----------------------------------------------------

/**
 * Translucent chip for meta badges that sit on the ambient wash (JD header,
 * company profile) rather than on an opaque card.
 */
export const META_CHIP = 'bg-surface/70 backdrop-blur-sm';
