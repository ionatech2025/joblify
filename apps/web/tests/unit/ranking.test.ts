import { describe, it, expect } from 'vitest';
import { rankScore, jaccard } from '@/lib/search/ranking';

const base = {
  algoliaScore: 0,
  skillOverlap: 0,
  daysSincePosted: 0,
  salaryFitDelta: 0,
  geoDistanceKm: null,
  employerQuality: 0,
};

describe('rankScore', () => {
  it('sums the always-on terms for a fresh, remote, in-budget job with no other signal', () => {
    // recency(day0)=1 → 0.15, salary(delta0)=1 → 0.10, geo(null)=1 → 0.05
    expect(rankScore(base)).toBeCloseTo(0.3, 6);
  });

  it('weights Algolia relevance most heavily (0.45)', () => {
    expect(rankScore({ ...base, algoliaScore: 1 }) - rankScore(base)).toBeCloseTo(0.45, 6);
  });

  it('decays recency exponentially with a ~14-day constant', () => {
    const delta = rankScore(base) - rankScore({ ...base, daysSincePosted: 14 });
    expect(delta).toBeCloseTo(0.15 * (1 - Math.exp(-1)), 6);
  });

  it('penalizes salary misfit by up to the salary weight (0.10)', () => {
    expect(rankScore(base) - rankScore({ ...base, salaryFitDelta: 1 })).toBeCloseTo(0.1, 6);
  });

  it('decays geo distance over 100km and clamps at zero', () => {
    const near = rankScore({ ...base, geoDistanceKm: 0 });
    const far = rankScore({ ...base, geoDistanceKm: 200 });
    expect(near - far).toBeCloseTo(0.05, 6);
  });
});

describe('jaccard', () => {
  it('is 0 for two empty sets', () => expect(jaccard([], [])).toBe(0));
  it('is 1 for identical sets, case-insensitively', () => expect(jaccard(['React', 'Node'], ['react', 'node'])).toBe(1));
  it('is intersection over union', () => expect(jaccard(['a', 'b'], ['b', 'c'])).toBeCloseTo(1 / 3, 6));
});
