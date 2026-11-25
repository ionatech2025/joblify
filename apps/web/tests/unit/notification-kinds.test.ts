import { describe, it, expect } from 'vitest';
import type { NotificationKind } from '@prisma/client';
import { notificationHref, type NotificationAudience } from '@/lib/ui/notifications';

// Payloads as the writers in app/actions store them.
const cases: [NotificationKind, NotificationAudience, Record<string, unknown>, string | null][] = [
  [
    'APPLICATION_STATUS_CHANGED',
    'JOB_SEEKER',
    { applicationId: 'a1', status: 'SHORTLISTED' },
    '/jobseeker/applications',
  ],
  ['APPLICATION_STATUS_CHANGED', 'COMPANY', { applicationId: 'a1', status: 'WITHDRAWN' }, null],
  ['APPLICATION_SUBMITTED', 'JOB_SEEKER', {}, '/jobseeker/applications'],
  ['INTERVIEW_SCHEDULED', 'JOB_SEEKER', {}, '/jobseeker/applications'],
  ['NEW_APPLICANT', 'COMPANY', { jobId: 'j1', applicationId: 'a1' }, '/company/applicants/j1'],
  ['NEW_APPLICANT', 'COMPANY', { jobId: 42 }, null],
  ['NEW_APPLICANT', 'JOB_SEEKER', { jobId: 'j1' }, null],
  ['INVITATION_RECEIVED', 'JOB_SEEKER', { invitationId: 'i1' }, '/jobseeker/subscriptions'],
  ['INVITATION_RECEIVED', 'COMPANY', { invitationId: 'i1' }, null],
  [
    'INVITATION_RESPONDED',
    'COMPANY',
    { invitationId: 'i1' },
    '/company/jobseekers?filter=subscribed',
  ],
  ['NEW_SUBSCRIBER', 'COMPANY', { jobSeekerId: 'u1' }, '/company/jobseekers?filter=subscribed'],
  ['NEW_SUBSCRIBER', 'JOB_SEEKER', {}, null],
  ['SYSTEM', 'JOB_SEEKER', { jobId: 'j1', jobSlug: 'rust-eng' }, '/jobs/rust-eng'],
  ['SYSTEM', 'JOB_SEEKER', { jobId: 'j1' }, null],
  ['SYSTEM', 'JOB_SEEKER', { jobSlug: null }, null],
  ['JOB_SHARED', 'JOB_SEEKER', { jobPostId: 'j1', jobSlug: 'rust-eng' }, '/jobs/rust-eng'],
  ['JOB_SHARED', 'JOB_SEEKER', { jobSlug: '' }, null],
  ['CHAT_AREA_ADDED', 'JOB_SEEKER', { chatAreaId: 'c1' }, '/jobseeker/chats/c1'],
  ['CHAT_AREA_ADDED', 'COMPANY', { chatAreaId: 'c1' }, '/company/chats/c1'],
  ['CHAT_AREA_ADDED', 'JOB_SEEKER', { chatAreaId: { id: 'c1' } }, null],
  ['ACCOUNT_UPDATE', 'COMPANY', { verificationStatus: 'REJECTED' }, null],
  ['ACCOUNT_UPDATE', 'JOB_SEEKER', {}, null],
];

describe('notificationHref', () => {
  it.each(cases)('%s for %s with %j opens %s', (kind, audience, payload, href) => {
    expect(notificationHref({ kind, payload }, audience)).toBe(href);
  });

  it('keeps a payload value inside its path segment', () => {
    expect(
      notificationHref({ kind: 'JOB_SHARED', payload: { jobSlug: '../admin?x=1' } }, 'JOB_SEEKER'),
    ).toBe('/jobs/..%2Fadmin%3Fx%3D1');
  });
});
