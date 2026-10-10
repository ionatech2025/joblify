import { describe, expect, it } from 'vitest';
import { MAX_PROFILE_SKILLS, PROFILE_SKILLS_LIMIT_MESSAGE } from '@/lib/profile-limits';
import { ResumeSchema } from '@/lib/ai/prompts/resume-parse';

describe('profile skill limit', () => {
  it('is never lower than what résumé parsing can hand back', () => {
    // The two used to disagree (40 vs 30): an account whose skills came from
    // auto-fill could not save any profile change.
    const parsedMax = (
      ResumeSchema.shape.skills as unknown as { _def: { maxLength: { value: number } } }
    )._def.maxLength.value;
    expect(MAX_PROFILE_SKILLS).toBeGreaterThanOrEqual(parsedMax);
  });

  it('tells the user what to do, not what the validator saw', () => {
    expect(PROFILE_SKILLS_LIMIT_MESSAGE).toContain(String(MAX_PROFILE_SKILLS));
    expect(PROFILE_SKILLS_LIMIT_MESSAGE).not.toMatch(/Array must contain/i);
  });
});
