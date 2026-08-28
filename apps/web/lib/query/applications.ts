'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './client';
import type { ApplicationStatus } from '@prisma/client';
import { withdrawApplication } from '@/app/actions/apply';
import { unwrap } from '@/lib/action-result';

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
      if (!res.ok)
        throw Object.assign(new Error('applications fetch failed'), { status: res.status });
      return res.json();
    },
    initialData,
    staleTime: 60_000,
  });
}

export function useWithdrawApplication(userId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.applications(userId);
  return useMutation({
    // unwrap so an expected failure ("already closed") rejects the mutation
    // with its real message — onError reads err.message, and a returned
    // { ok: false } would otherwise resolve as a success and roll nothing back.
    mutationFn: async (applicationId: string) => unwrap(await withdrawApplication(applicationId)),
    onMutate: async (applicationId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ApplicationListItem[]>(key);
      if (previous) {
        queryClient.setQueryData<ApplicationListItem[]>(
          key,
          previous.map((a) => (a.id === applicationId ? { ...a, status: 'WITHDRAWN' } : a)),
        );
      }
      return { previous };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
