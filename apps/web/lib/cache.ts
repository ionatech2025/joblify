// Cache tag helpers. Centralizes tag naming so `updateTag` and `'use cache'`
// always agree. Tag namespaces map to the data they invalidate.

export const tags = {
  job: (id: string) => `job:${id}`,
  jobs: () => 'jobs' as const,
  jobsList: () => 'jobs',
  company: (id: string) => `company:${id}`,
  companies: () => 'companies' as const,
  user: (id: string) => `user:${id}`,
  userApplications: (id: string) => `user:${id}:applications`,
  notifications: (id: string) => `user:${id}:notifications`,
  jobApplicants: (jobId: string) => `job:${jobId}:applicants`,
} as const;
