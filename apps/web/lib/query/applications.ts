'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './client';
import type { ApplicationStatus } from '@prisma/client';

export type ApplicationListItem = {
  id: string;
  jobPostId: string;
  slug: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  appliedAt: string;
  matchScore: number | null;
};

// Drives the `/jobseeker/applications` page. Initial data ships from the
// server component; this hook handles client refetch + status-update
// optimistic UI from `useUpdateApplicationStatus` (Week 7).

export function useApplications(userId: string, initialData?: ApplicationListItem[]) {
  return useQuery({
    queryKey: queryKeys.applications(userId),
    queryFn: async (): Promise<ApplicationListItem[]> => {
      const res = await fetch('/api/v1/applications');
      if (!res.ok) throw Object.assign(new Error('applications fetch failed'), { status: res.status });
      return res.json();
    },
    initialData,
    staleTime: 60_000,
  });
}
