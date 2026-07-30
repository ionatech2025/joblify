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
