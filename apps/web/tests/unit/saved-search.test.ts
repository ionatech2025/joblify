import { describe, it, expect } from 'vitest';
import { savedSearchWhere, defaultSearchLabel } from '@/lib/search/saved-search';

describe('savedSearchWhere', () => {
  it('is empty for a blank query', () => {
    expect(savedSearchWhere('')).toEqual({});
  });

  it('maps the structured enum filters', () => {
    expect(savedSearchWhere('workMode=REMOTE&jobType=FULL_TIME&experienceLevel=SENIOR')).toEqual({
      workMode: 'REMOTE',
      jobType: 'FULL_TIME',
      experienceLevel: 'SENIOR',
    });
  });

  it('ignores invalid enum values', () => {
    expect(savedSearchWhere('workMode=BOGUS&jobType=')).toEqual({});
  });

  it('brackets overlapping salary bands like the search route', () => {
    expect(savedSearchWhere('salaryMin=100000&salaryMax=150000')).toEqual({
      salaryMax: { gte: 100000 },
      salaryMin: { lte: 150000 },
    });
  });

  it('turns free text into a title/description contains', () => {
    expect(savedSearchWhere('q=engineer')).toEqual({
      AND: [
        {
          OR: [
            { title: { contains: 'engineer', mode: 'insensitive' } },
            { description: { contains: 'engineer', mode: 'insensitive' } },
          ],
        },
      ],
    });
  });

  it('combines free text + location under AND', () => {
    const where = savedSearchWhere('q=react&location=Berlin&workMode=REMOTE');
    expect(where.workMode).toBe('REMOTE');
    expect(where.AND).toHaveLength(2);
  });
});

describe('defaultSearchLabel', () => {
  it('falls back to "All jobs" for an empty query', () => {
    expect(defaultSearchLabel('')).toBe('All jobs');
  });

  it('summarizes query + location + work mode', () => {
    expect(defaultSearchLabel('q=react&location=Berlin&workMode=REMOTE')).toBe(
      '"react" in Berlin remote',
    );
  });
});
