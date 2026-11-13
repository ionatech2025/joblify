import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { prerender } from 'react-dom/static';

const m = vi.hoisted(() => ({
  requireRole: vi.fn(),
  appFindMany: vi.fn(),
  appCount: vi.fn(),
  resumeFindMany: vi.fn(),
  savedJobFindMany: vi.fn(),
  savedSearchFindMany: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/db', () => ({
  db: {
    jobApplication: { findMany: m.appFindMany, count: m.appCount },
    resume: { findMany: m.resumeFindMany },
    savedJob: { findMany: m.savedJobFindMany },
    savedSearch: { findMany: m.savedSearchFindMany },
  },
}));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/jobseeker',
}));
vi.mock('@/app/(authenticated)/jobseeker/applications/applications-list', () => ({
  ApplicationsList: () => null,
}));
vi.mock('@/app/(authenticated)/jobseeker/recently-viewed', () => ({
  RecentlyViewed: () => null,
}));
vi.mock('@/app/actions/uploads', () => ({
  deleteResume: vi.fn(),
  registerResume: vi.fn(),
  uploadResumeDirect: vi.fn(),
}));
vi.mock('@/app/actions/saved-jobs', () => ({ toggleSavedJob: vi.fn() }));
vi.mock('@/app/actions/saved-searches', () => ({ deleteSavedSearch: vi.fn() }));

import ApplicationsPage from '@/app/(authenticated)/jobseeker/applications/page';
import ResumesPage from '@/app/(authenticated)/jobseeker/resumes/page';
import SavedJobsPage from '@/app/(authenticated)/jobseeker/saved/page';

async function html(node: ReactNode): Promise<string> {
  const { prelude } = await prerender(node);
  return (await new Response(prelude).text()).replaceAll('<!-- -->', '');
}

const params = (sp: Record<string, string>) => ({ searchParams: Promise.resolve(sp) });

beforeEach(() => {
  vi.clearAllMocks();
  m.requireRole.mockResolvedValue({ id: 'seeker_1', plan: 'PRO' });
  m.appFindMany.mockResolvedValue([]);
  m.appCount.mockResolvedValue(0);
  m.resumeFindMany.mockResolvedValue([
    {
      id: 'r1',
      title: 'CV.pdf',
      parsedJson: {},
      parseFailedAt: null,
      createdAt: new Date('2026-01-01T00:00:00Z'),
    },
  ]);
  m.savedJobFindMany.mockResolvedValue([]);
  m.savedSearchFindMany.mockResolvedValue([]);
});

describe('applications page banners', () => {
  it('announces a submitted application as a status message', async () => {
    const out = await html(await ApplicationsPage(params({ just_applied: '1' })));
    expect(out).toMatch(/<p role="status"[^>]*>Application submitted/);
  });

  it('explains the redirect when the job was already applied to', async () => {
    const out = await html(await ApplicationsPage(params({ already_applied: '1' })));
    expect(out).toMatch(/<p role="status"[^>]*>You already applied to that job/);
  });

  it('shows neither banner on a plain visit', async () => {
    const out = await html(await ApplicationsPage(params({})));
    expect(out).not.toContain('role="status"');
  });
});

describe('resumes page returnTo', () => {
  it('links back to the apply page it came from', async () => {
    const out = await html(await ResumesPage(params({ returnTo: '/jobs/backend-engineer/apply' })));
    expect(out).toMatch(/href="\/jobs\/backend-engineer\/apply"[^>]*>.*Back to your application/);
  });

  it.each([
    'https://evil.example/jobs/x',
    '//evil.example/jobs/x',
    '/admin',
    'javascript:alert(1)',
  ])('ignores a returnTo that is not a job path (%s)', async (returnTo) => {
    const out = await html(await ResumesPage(params({ returnTo })));
    expect(out).not.toContain('Back to your application');
  });
});

describe('saved jobs page', () => {
  const PAST = new Date('2026-01-15T00:00:00Z');
  function savedJob(slug: string, status: string, applicationDeadline: Date | null) {
    return {
      jobPost: {
        id: `id_${slug}`,
        slug,
        title: `Role ${slug}`,
        location: null,
        status,
        applicationDeadline,
        company: { deletedAt: null, companyProfile: { companyName: 'Acme' } },
      },
    };
  }

  it('asks for saved jobs that closed, not only published ones', async () => {
    await SavedJobsPage();
    const where = m.savedJobFindMany.mock.lastCall?.[0].where;
    expect(where).toEqual({ userId: 'seeker_1', jobPost: { deletedAt: null } });
  });

  it('marks closed jobs and only links the ones that still have a page', async () => {
    m.savedJobFindMany.mockResolvedValue([
      savedJob('open', 'PUBLISHED', null),
      savedJob('expired', 'PUBLISHED', PAST),
      savedJob('archived', 'ARCHIVED', null),
    ]);
    const out = await html(await SavedJobsPage());
    expect(out.match(/No longer accepting applications/g)).toHaveLength(2);
    expect(out).toContain('href="/jobs/open"');
    expect(out).toContain('href="/jobs/expired"');
    expect(out).not.toContain('href="/jobs/archived"');
    expect(out).toContain('Role archived');
  });
});
