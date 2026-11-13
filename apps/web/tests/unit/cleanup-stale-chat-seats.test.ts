import { describe, it, expect } from 'vitest';
import type { ApplicationStatus } from '@prisma/client';
import { isStaleSeat, type JobChatSeat } from '@/scripts/cleanup-stale-chat-seats';

// A job chat area seats only candidates whose application to that job is
// shortlisted or further. The cleanup removes every other seeker seat that
// predates that rule, and never a company's own seat.

const seat = (over: Partial<JobChatSeat> = {}): JobChatSeat => ({
  chatAreaId: 'area1',
  title: 'Engineer',
  jobPostId: 'job1',
  userId: 'seeker1',
  userType: 'JOB_SEEKER',
  status: null,
  ...over,
});

describe('isStaleSeat', () => {
  it('removes a seeker who never applied to the job', () => {
    expect(isStaleSeat(seat())).toBe(true);
  });

  it.each<ApplicationStatus>(['SUBMITTED', 'VIEWED', 'REJECTED', 'WITHDRAWN'])(
    'removes a seeker whose application is %s',
    (status) => {
      expect(isStaleSeat(seat({ status }))).toBe(true);
    },
  );

  it.each<ApplicationStatus>(['SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFER_EXTENDED', 'HIRED'])(
    'keeps a seeker whose application is %s',
    (status) => {
      expect(isStaleSeat(seat({ status }))).toBe(false);
    },
  );

  it('keeps the company and admin seats, which no application backs', () => {
    expect(isStaleSeat(seat({ userId: 'company1', userType: 'COMPANY' }))).toBe(false);
    expect(isStaleSeat(seat({ userId: 'admin1', userType: 'ADMIN' }))).toBe(false);
  });
});
