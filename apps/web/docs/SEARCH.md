# Search

Algolia is the primary search engine. Postgres FTS + pgvector are the relevance backstops; v1.5 may rerank via embeddings if Algolia's base ranking isn't enough.

## Why Algolia

- Sub-50ms p95 globally; geographic replicas for EU + US data residency.
- Faceted search + synonyms + typo tolerance + personalization out of the box.
- Vercel Marketplace one-click install.
- A/B test framework included — critical for tuning ranking on a job board.

Build plan covers 10k MAU; Grow plan at ~100k MAU. The cost delta is well below the engineering cost of self-hosting Typesense / OpenSearch.

## Indexes

Three indexes, defined in `lib/search/algolia.ts` `INDEX`:

| Index | Records | Source of truth |
|---|---|---|
| `jobs` | One per published JD | `job_posts` table |
| `companies` | One per verified company | `company_profiles` table |
| `skills` | One per canonical skill | `skills` table |

## `jobs` record shape

```ts
type JobSearchRecord = {
  objectID: string;            // job_posts.id (UUID)
  slug: string;                // for /jobs/[slug] links
  title, description: string;
  companyId, companyName: string;
  companyLogoUrl: string | null;
  industry, jobType, experienceLevel, workMode: string;
  location: string | null;
  salaryMin, salaryMax: number | null;
  salaryCurrency: string;
  publishedAt: number;         // ms epoch — used for recency boost
  skills: string[];            // canonical labels
  _geoloc?: { lat: number; lng: number };
};
```

`_geoloc` enables `aroundLatLng` + `aroundRadius` queries.

## Indexing pipeline

Push-based, fire-and-forget on the hot path, reconciled by cron.

```
Server Action mutates job_posts ──┐
                                   ▼
                          reindexJob(jobId)  [lib/search/index-job.ts]
                                   │
                                   ▼
                          algolia.partialUpdateObject
                                   │
                                   ▼
                          (on failure: log + cron will re-pick-up)
```

The 15-minute cron at `/api/v1/cron/algolia-reconcile` re-scans `job_posts` updated in the last 30 minutes and re-pushes — covers any transient Algolia failure that the inline call didn't recover from.

V1.5 should add an explicit `index_outbox` table for stronger guarantees. The cron approach is fine while volume is low.

## Ranking strategy

### Base: Algolia textual relevance

Configure in the Algolia dashboard:

- **Searchable attributes** (priority order): `title`, `companyName`, `skills`, `description`, `location`.
- **Typo tolerance**: standard for `title` + `companyName`; off for `skills`.
- **Synonyms**: add as you learn user queries — e.g. "software engineer" ↔ "swe", "data scientist" ↔ "ds".
- **Custom ranking**: `desc(publishedAt)` so fresh jobs win ties.

### Composite signal: client-side rerank (lib/search/ranking.ts)

```ts
rankScore = 0.45 * algoliaScore
          + 0.20 * skillOverlap            // Jaccard of user skills vs job skills
          + 0.15 * recency                  // exp(-daysSincePosted / 14)
          + 0.10 * salaryFit
          + 0.05 * geoDistance              // decay over 100km
          + 0.05 * employerQuality
```

Tunes from A/B tests once traffic accumulates. The weights above are a defensible V1; don't overfit before you have data.

### V1.5: AI vector reranking

Plan: take Algolia's top-50, embed the query, cosine-rank against `job_posts.embedding`, return top-20. Lifts relevance on long-tail queries where text overlap is weak. Add when search CTR plateaus.

## Frontend

`/jobs/page.tsx` mounts `<JobsSearch>` (client). The component:

1. Reads filter draft from Zustand `useSearchStore`.
2. Calls `/api/v1/jobs/search?<query>` via TanStack Query, keyed on the draft.
3. Renders results; pagination is offset-based via `?page=`.

No React InstantSearch in V1 — kept the client lean. Add if facet rendering gets complex.

## Route Handler

`app/api/v1/jobs/search/route.ts`:

```ts
- rate limit by IP (searchLimit: 100/min)
- parse query params
- compose Algolia filters
- adminClient().search<JobSearchRecord>({ requests: [{ indexName, query, filters, page, hitsPerPage: 20, aroundLatLngViaIP, aroundRadius }] })
- return { hits, nbHits, page, nbPages }
```

Uses the admin key (server-side). The browser never sees `ALGOLIA_ADMIN_API_KEY`. If we move to client-side InstantSearch, switch to a scoped search key (`generateSecuredApiKey` with filters limiting to `PUBLISHED` jobs).

## Data residency

Production index lives in Algolia's EU region (Frankfurt). For US traffic, configure a replica via the Algolia dashboard. Vercel routes by `regions: ['fra1', 'dub1', 'iad1']` in `vercel.ts`; pair the index region with the function region.

## Cost shape

| Metric | Plan implication |
|---|---|
| Records | Build plan = up to 1M total. We'll fit comfortably at 10k MAU. |
| Operations | Each search + each index op counts. Build plan = 10k ops/mo free; pay-as-you-go after. |
| Replicas | Each replica counts as a separate index. EU + US = 2× cost. |

At 10k MAU + 1k JDs daily, expect ~$40–80/mo. At 100k MAU, ~$200–400/mo.

## Operations

- **Re-build the index from scratch**: empty the Algolia index in the dashboard, then run `bun run scripts/reindex-all.ts` (TODO Week 11 follow-up) which scans `job_posts` and pushes everything.
- **Check sync drift**: count rows in Algolia vs `db.jobPost.count({ where: { status: 'PUBLISHED', deletedAt: null } })`. Should match within 1%. The reconcile cron closes drift inside 15 min.
- **Debug a missing job**: pull the record from Algolia dashboard → check `objectID` matches `job_posts.id` → check `status` and `deletedAt` in Postgres → manually re-run `reindexJob(jobId)` via a one-shot script if needed.
- **Tune ranking**: A/B test in Algolia dashboard. Don't change `lib/search/ranking.ts` weights without telemetry to back the move.
- **Synonyms**: add via the Algolia dashboard, not in code. They live with the index.

## Fallback strategy

If Algolia is down, the `/api/v1/jobs/search` Route Handler returns a 502. Client surfaces an error message ("Search is temporarily unavailable"). The cached JD pages (`/jobs/[slug]`) and direct URLs still work via Postgres. Browse by company (`/companies/[slug]`) still works.

A future enhancement: degrade to Postgres FTS via the `tsv` column when Algolia returns 5xx — but only if availability becomes a real problem. Build plan SLO is high enough that the fallback isn't worth maintaining yet.

## Skills index

Smaller, simpler. Used for skill-autocomplete on the post-job form and the profile editor:

- `objectID = Skill.id`
- `label` (searchable)
- `aliases` (searchable, equal weight)

Indexed manually on `bun run seed:skills` and on any subsequent skill catalogue updates. There's no continuous sync — skills are a low-volume curated set.
