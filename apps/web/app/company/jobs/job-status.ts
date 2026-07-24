import type { JobPostStatus } from '@prisma/client';

// Humanized job-post status labels + semantic badge tones, shared by the
// company jobs list and the edit page so no raw enum text leaks into the UI.
export const JOB_STATUS_LABEL: Record<JobPostStatus, string> = {
  DRAFT: 'Draft',
  PENDING_REVIEW: 'Pending review',
  PUBLISHED: 'Published',
  CLOSED: 'Closed',
  ARCHIVED: 'Archived',
};

export const JOB_STATUS_TONE: Record<JobPostStatus, 'success' | 'warn' | 'neutral'> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warn',
  PUBLISHED: 'success',
  CLOSED: 'neutral',
  ARCHIVED: 'neutral',
};
