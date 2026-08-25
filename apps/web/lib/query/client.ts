import { QueryClient, isServer } from '@tanstack/react-query';

// Centralized QueryClient config. Two patterns:
//  - In React Server Components, fetch directly with Prisma — no QueryClient needed.
//  - In Client Components, use the QueryClient provided by app/providers.tsx
//    via useQuery/useMutation/useInfiniteQuery.
//
// The provider creates a *new* QueryClient per request on the server so caches
// don't leak between users, and a single shared client in the browser.

const DEFAULT_OPTIONS = {
  queries: {
    // 30s gives us snappy UI without thrashing the API; bump per-query when needed.
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount: number, error: unknown) => {
      const status =
        typeof error === 'object' && error !== null && 'status' in error
          ? (error as { status: number }).status
          : 0;
      if (status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  },
  mutations: {
    retry: 0,
  },
} as const;

function makeQueryClient(): QueryClient {
  return new QueryClient({ defaultOptions: DEFAULT_OPTIONS });
}

let browserClient: QueryClient | undefined;

export function getQueryClient(): QueryClient {
  if (isServer) return makeQueryClient();
  browserClient ??= makeQueryClient();
  return browserClient;
}

// Centralized query keys so refetch / invalidate stay in sync across the app.
export const queryKeys = {
  notifications: () => ['notifications'] as const,
  applications: (userId: string) => ['applications', userId] as const,
  application: (id: string) => ['application', id] as const,
  jobMatchScore: (userId: string, jobId: string) => ['match-score', userId, jobId] as const,
  searchJobs: (filters: unknown) => ['search', 'jobs', filters] as const,
} as const;

/**
 * How many applications either side of `/jobseeker/applications` will load.
 * The server component that seeds the list and `/api/v1/applications` that
 * refetches it must agree, or a background refetch silently changes how much of
 * the history is on screen.
 *
 * Lives here, not in `query/applications.ts`, because that module is
 * `'use client'` — a route handler importing a value from it would receive a
 * client-reference proxy rather than the number.
 *
 * The cap is *stated* in the UI when it bites (see `applications-list.tsx`); it
 * used to truncate at 50 with nothing on screen admitting more rows existed.
 */
export const APPLICATIONS_PAGE_CAP = 50;
