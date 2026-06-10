// Composite ranking signal applied client-side after Algolia returns the base
// relevance set. Weights are intentionally simple — tune from A/B tests once
// search traffic accumulates.

export type RankingInputs = {
  algoliaScore: number; // 0..1 from Algolia (treat as base)
  skillOverlap: number; // 0..1 — Jaccard of user skills vs job skills
  daysSincePosted: number;
  salaryFitDelta: number; // 0..1 — 0 if inside range, otherwise normalized gap
  geoDistanceKm: number | null; // null = remote / unknown
  employerQuality: number; // 0..1 — completion %, verified, response rate
};

export function rankScore(i: RankingInputs): number {
  const recency = Math.exp(-i.daysSincePosted / 14);
  const geo = i.geoDistanceKm === null ? 1 : Math.max(0, 1 - i.geoDistanceKm / 100);
  const salary = 1 - Math.min(1, Math.max(0, i.salaryFitDelta));

  return (
    0.45 * i.algoliaScore +
    0.2 * i.skillOverlap +
    0.15 * recency +
    0.1 * salary +
    0.05 * geo +
    0.05 * i.employerQuality
  );
}

export function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const A = new Set(a.map((s) => s.toLowerCase()));
  const B = new Set(b.map((s) => s.toLowerCase()));
  let intersection = 0;
  for (const x of A) if (B.has(x)) intersection++;
  return intersection / (A.size + B.size - intersection);
}
