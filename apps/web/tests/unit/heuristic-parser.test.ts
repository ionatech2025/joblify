import { describe, it, expect } from 'vitest';
import { heuristicParseResume, yearsFromExperience } from '@/lib/resume/heuristic-parser';

describe('yearsFromExperience', () => {
  const now = new Date('2026-10-10T00:00:00Z');

  it('spans earliest start to latest end among entries that have real dates', () => {
    expect(
      yearsFromExperience(
        [
          { startDate: 'Jan 2018', endDate: 'Dec 2020' },
          { startDate: '2021', endDate: 'Present' },
        ],
        now,
      ),
    ).toBe(8); // 2018 → 2026
  });

  it('is null — "unknown", not a guess — when nothing is dated', () => {
    expect(yearsFromExperience([], now)).toBeNull();
    expect(yearsFromExperience([{ startDate: null, endDate: null }], now)).toBeNull();
  });

  it('ignores impossible dates (a start in the future, an end before the start)', () => {
    expect(yearsFromExperience([{ startDate: '2031', endDate: 'Present' }], now)).toBeNull();
    expect(yearsFromExperience([{ startDate: '2020', endDate: '2010' }], now)).toBeNull();
  });
});

describe('heuristicParseResume — never invents', () => {
  it('does not turn an incidental year into a career length', () => {
    const parsed = heuristicParseResume(
      'Jane Doe\nPlatform Engineer\nContact: P.O. Box 1990, Kampala. Founded the club in 1994.\nSkills: Rust',
      ['rust'],
    );
    // The old parser took min(any 4-digit year) → ~32 "years of experience".
    expect(parsed.yearsExperience).toBeNull();
  });

  it('drops an experience entry whose title is not in the text rather than defaulting one', () => {
    const text = [
      'Jane Doe',
      'ABOUT',
      'Hands-on practitioner.',
      'WORK EXPERIENCE',
      'Initech',
      'Mar 2019 – Present',
      'Handled the thing nobody else wanted to handle.',
      'EDUCATION',
    ].join('\n');
    const parsed = heuristicParseResume(text);
    for (const job of parsed.experience) {
      expect(job.title).not.toBe('Software Engineer');
      expect(text).toContain(job.title);
    }
  });

  it('keeps the dates it did find, with the year', () => {
    const text = [
      'Jane Doe',
      'WORK EXPERIENCE',
      'Initech',
      'Feb 2019 – Present',
      'SENIOR ENGINEER',
      'Built stuff',
      'EDUCATION',
    ].join('\n');
    const [job] = heuristicParseResume(text).experience;
    expect(job?.startDate).toBe('Feb 2019');
    expect(job?.endDate).toBe('Present');
  });
});
