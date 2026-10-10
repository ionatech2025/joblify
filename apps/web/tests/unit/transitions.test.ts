import { describe, it, expect } from 'vitest';
import type { ApplicationStatus } from '@prisma/client';
import { checkRecruiterTransition, RECRUITER_STATUSES } from '@/lib/applications/transitions';

const ALL: ApplicationStatus[] = [
  'SUBMITTED',
  'VIEWED',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'OFFER_EXTENDED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
];

describe('checkRecruiterTransition', () => {
  it('WITHDRAWN is never a recruiter target', () => {
    for (const from of ALL) {
      expect(checkRecruiterTransition(from, 'WITHDRAWN').ok).toBe(false);
    }
  });

  it('a withdrawn application cannot be moved by anyone but the candidate', () => {
    for (const to of RECRUITER_STATUSES) {
      const r = checkRecruiterTransition('WITHDRAWN', to);
      expect(r.ok).toBe(false);
    }
  });

  it('every move between recruiter-controlled stages is allowed (mis-clicks must be fixable)', () => {
    for (const from of RECRUITER_STATUSES) {
      for (const to of RECRUITER_STATUSES) {
        expect(checkRecruiterTransition(from, to)).toEqual({ ok: true });
      }
    }
  });

  it('rejects a value that is not a status at all', () => {
    expect(checkRecruiterTransition('SUBMITTED', 'DELETED' as ApplicationStatus).ok).toBe(false);
  });
});
