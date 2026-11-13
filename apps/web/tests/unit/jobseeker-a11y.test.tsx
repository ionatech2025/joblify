// @vitest-environment jsdom
//
// Jobseeker list and toggle controls: where focus goes when a control removes
// itself (WCAG 2.4.3), what is announced (4.1.3), and what unread means to a
// screen reader (1.3.1). Before this, each of these controls either unmounted
// or set `disabled` under the user's focus, which drops focus to <body>.

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import type { ReactNode } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApplicationsList } from '@/app/(authenticated)/jobseeker/applications/applications-list';
import { NotificationsList } from '@/app/(authenticated)/jobseeker/notifications/notifications-list';
import { DigestPreference } from '@/app/(authenticated)/jobseeker/notifications/digest-preference';
import { SavedList, type SavedRow } from '@/app/(authenticated)/jobseeker/saved/saved-list';
import { SavedSearchList } from '@/app/(authenticated)/jobseeker/saved/saved-search-list';
import { ResumeManager } from '@/app/(authenticated)/jobseeker/resumes/resume-manager';
import { ResumeBuilderForm } from '@/app/(authenticated)/jobseeker/resumes/builder/builder-form';
import { SaveButton } from '@/app/(marketing)/jobs/[slug]/save-button';
import { ApplyForm } from '@/app/(marketing)/jobs/[slug]/apply/apply-form';
import type { ApplicationListItem } from '@/lib/query/applications';
import type { NotificationItem } from '@/lib/query/notifications';

const m = vi.hoisted(() => ({
  withdrawApplication: vi.fn(),
  toggleSavedJob: vi.fn(),
  deleteSavedSearch: vi.fn(),
  deleteResume: vi.fn(),
  setDigestOptIn: vi.fn(),
}));

vi.mock('@/app/actions/apply', () => ({
  withdrawApplication: m.withdrawApplication,
  submitApplication: vi.fn(),
}));
vi.mock('@/app/actions/saved-jobs', () => ({ toggleSavedJob: m.toggleSavedJob }));
vi.mock('@/app/actions/saved-searches', () => ({ deleteSavedSearch: m.deleteSavedSearch }));
vi.mock('@/app/actions/uploads', () => ({
  deleteResume: m.deleteResume,
  registerResume: vi.fn(),
  uploadResumeDirect: vi.fn(),
}));
vi.mock('@/app/actions/email-preferences', () => ({ setDigestOptIn: m.setDigestOptIn }));
vi.mock('@/app/actions/work-experience', () => ({ saveWorkExperiences: vi.fn() }));
vi.mock('@/app/actions/generate-resume', () => ({ generateResume: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const never = () => new Promise<never>(() => {});

function withQuery(ui: ReactNode, seed?: [readonly unknown[], unknown]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  if (seed) client.setQueryData(...seed);
  return <QueryClientProvider client={client}>{ui}</QueryClientProvider>;
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(never));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  for (const fn of Object.values(m)) fn.mockReset();
});

function application(id: string, jobTitle: string): ApplicationListItem {
  return {
    id,
    jobPostId: `job_${id}`,
    slug: `job-${id}`,
    jobTitle,
    companyName: 'Acme',
    status: 'SUBMITTED',
    appliedAt: '2026-10-01T00:00:00.000Z',
    matchScore: null,
  };
}

describe('ApplicationsList', () => {
  const rows = [application('a1', 'Backend Engineer'), application('a2', 'Data Analyst')];

  it('tells the truth about withdrawing: there is no re-applying', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(withQuery(<ApplicationsList userId="u1" initialData={rows} total={2} />));
    await userEvent.click(screen.getAllByRole('button', { name: 'Withdraw' })[0]!);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("can't apply to this job again"));
    expect(confirm).not.toHaveBeenCalledWith(expect.stringMatching(/re-apply/));
    expect(m.withdrawApplication).not.toHaveBeenCalled();
  });

  it('moves focus to the next Withdraw, which stays focusable while the first is pending', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    m.withdrawApplication.mockImplementation(never);
    render(withQuery(<ApplicationsList userId="u1" initialData={rows} total={2} />));
    const [first, second] = screen.getAllByRole('button', { name: 'Withdraw' });
    await userEvent.click(first!);

    expect(document.activeElement).toBe(second);
    await waitFor(() => expect(second!.getAttribute('aria-disabled')).toBe('true'));
    expect((second as HTMLButtonElement).disabled).toBe(false);
    expect(document.activeElement).toBe(second);

    await userEvent.click(second!);
    expect(m.withdrawApplication).toHaveBeenCalledTimes(1);
  });

  it("falls back to the row's job link when no other Withdraw is left", async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    m.withdrawApplication.mockImplementation(never);
    render(withQuery(<ApplicationsList userId="u1" initialData={rows.slice(0, 1)} total={1} />));
    await userEvent.click(screen.getByRole('button', { name: 'Withdraw' }));
    expect(document.activeElement).toBe(screen.getByRole('link', { name: 'Backend Engineer' }));
  });

  it('does not announce background refreshes', () => {
    const { container } = render(
      withQuery(<ApplicationsList userId="u1" initialData={rows} total={2} />),
    );
    expect(container.querySelector('[aria-live]')).toBeNull();
  });
});

function notification(id: string, over: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id,
    kind: 'APPLICATION_STATUS_CHANGED',
    payload: {
      jobTitle: 'Backend Engineer',
      companyName: 'Acme',
      message: 'Your application status changed to Shortlisted.',
    },
    readAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    ...over,
  };
}

describe('NotificationsList', () => {
  it('names the job and company on a status update and links to the application', () => {
    render(withQuery(<NotificationsList initial={[notification('n1')]} />));
    expect(screen.getByText('Backend Engineer at Acme')).toBeDefined();
    expect(screen.getByText('Your application status changed to Shortlisted.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Track application' }).getAttribute('href')).toBe(
      '/jobseeker/applications',
    );
  });

  it('does not offer a jobseeker link on the company side', () => {
    render(withQuery(<NotificationsList initial={[notification('n1')]} role="COMPANY" />));
    expect(screen.queryByRole('link', { name: 'Track application' })).toBeNull();
  });

  it('says "Unread" in text, not only with a dot and bold type', () => {
    render(
      withQuery(
        <NotificationsList
          initial={[notification('n1'), notification('n2', { readAt: '2026-10-02T00:00:00Z' })]}
        />,
      ),
    );
    const [unread, read] = screen.getAllByRole('listitem');
    expect(unread!.textContent).toContain('Unread:');
    expect(read!.textContent).not.toContain('Unread:');
  });

  it('moves focus to the next Mark read, then to the list when none is left', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        init?.method === 'POST' ? Promise.resolve(new Response(null)) : never(),
      ),
    );
    const items = [notification('n1'), notification('n2')];
    render(withQuery(<NotificationsList initial={items} />, [['notifications'], items]));
    const [first, second] = screen.getAllByRole('button', { name: 'Mark read' });
    await userEvent.click(first!);
    expect(document.activeElement).toBe(second);
    expect((second as HTMLButtonElement).disabled).toBe(false);

    await waitFor(() =>
      expect(screen.getAllByRole('button', { name: 'Mark read' })).toHaveLength(1),
    );
    await waitFor(() => expect(second!.getAttribute('aria-disabled')).toBeNull());
    await userEvent.click(second!);
    expect(document.activeElement).toBe(screen.getByRole('list', { name: 'Notifications' }));
  });
});

describe('DigestPreference', () => {
  it('keeps focus on the checkbox while the change is saving, and ignores clicks meanwhile', async () => {
    m.setDigestOptIn.mockImplementation(never);
    render(<DigestPreference initialOptIn={false} addressSuppressed={false} />);
    const box = screen.getByRole('checkbox', { name: /daily digest/i }) as HTMLInputElement;
    await userEvent.click(box);
    expect(box.checked).toBe(true);
    expect(box.disabled).toBe(false);
    expect(box.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(box);

    await userEvent.click(box);
    expect(box.checked).toBe(true);
    expect(m.setDigestOptIn).toHaveBeenCalledTimes(1);
  });
});

describe('SaveButton', () => {
  it('keeps focus while saving instead of disabling itself', async () => {
    m.toggleSavedJob.mockImplementation(never);
    render(<SaveButton jobId="job_1" initialSaved={false} />);
    const button = screen.getByRole('button', { name: 'Save job' }) as HTMLButtonElement;
    await userEvent.click(button);
    const saving = screen.getByRole('button', { name: 'Saved' }) as HTMLButtonElement;
    expect(saving.disabled).toBe(false);
    expect(saving.getAttribute('aria-disabled')).toBe('true');
    expect(document.activeElement).toBe(saving);

    await userEvent.click(saving);
    expect(m.toggleSavedJob).toHaveBeenCalledTimes(1);
  });
});

function saved(id: string, title: string, availability: SavedRow['availability']): SavedRow {
  return { id, slug: `job-${id}`, title, company: 'Acme', location: null, availability };
}

describe('SavedList', () => {
  it('keeps a closed job with a badge, and does not link one whose page is gone', () => {
    render(
      <SavedList
        headingId="h"
        initial={[
          saved('j1', 'Open Role', 'open'),
          saved('j2', 'Past Deadline', 'closed'),
          saved('j3', 'Taken Down', 'unlisted'),
        ]}
      />,
    );
    const [, open, closed, unlisted] = screen.getAllByRole('row');
    expect(open!.textContent).not.toContain('No longer accepting applications');
    expect(closed!.textContent).toContain('No longer accepting applications');
    expect(unlisted!.textContent).toContain('No longer accepting applications');
    expect(screen.getByRole('link', { name: 'Past Deadline' }).getAttribute('href')).toBe(
      '/jobs/job-j2',
    );
    expect(screen.queryByRole('link', { name: 'Taken Down' })).toBeNull();
  });

  it('moves focus to the next Remove, then to the list heading', async () => {
    m.toggleSavedJob.mockResolvedValue({ ok: true, data: { saved: false } });
    render(
      <>
        <h2 id="saved-heading" tabIndex={-1}>
          Saved jobs
        </h2>
        <SavedList
          headingId="saved-heading"
          initial={[saved('j1', 'First', 'open'), saved('j2', 'Second', 'open')]}
        />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove First from saved' }));
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Remove Second from saved' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Remove Second from saved' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Saved jobs' }));
  });
});

describe('SavedSearchList', () => {
  it('moves focus to the list heading when the last search is deleted', async () => {
    m.deleteSavedSearch.mockResolvedValue(undefined);
    render(
      <>
        <h2 id="searches-heading" tabIndex={-1}>
          Saved searches
        </h2>
        <SavedSearchList
          headingId="searches-heading"
          initial={[{ id: 's1', label: 'Remote Rust', query: 'q=rust' }]}
        />
      </>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete saved search Remote Rust' }));
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Saved searches' }));
  });
});

describe('ResumeManager', () => {
  const resumes = [
    { id: 'r1', title: 'CV 2025.pdf', parsed: true, parseFailed: false, createdAt: '2026-01-01' },
    { id: 'r2', title: 'CV 2026.pdf', parsed: true, parseFailed: false, createdAt: '2026-02-01' },
  ];

  it('moves focus to the next Delete, then to Upload when the list empties', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    m.deleteResume.mockResolvedValue(undefined);
    render(<ResumeManager userId="u1" initialResumes={resumes} returnTo={null} />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete CV 2025.pdf' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Delete CV 2026.pdf' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete CV 2026.pdf' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: /upload a resume/i }));
  });

  it('offers the way back to the application it was sent from', () => {
    render(
      <ResumeManager
        userId="u1"
        initialResumes={resumes}
        returnTo="/jobs/backend-engineer/apply"
      />,
    );
    expect(
      screen.getByRole('link', { name: 'Back to your application' }).getAttribute('href'),
    ).toBe('/jobs/backend-engineer/apply');
  });

  it('says nothing about an application when it was not sent from one', () => {
    render(<ResumeManager userId="u1" initialResumes={resumes} returnTo={null} />);
    expect(screen.queryByRole('link', { name: 'Back to your application' })).toBeNull();
  });
});

describe('ApplyForm without a résumé', () => {
  it('sends you to upload one with a way back to this application', () => {
    render(<ApplyForm jobId="job_1" jobSlug="backend-engineer" resumes={[]} />);
    expect(screen.getByRole('link', { name: /upload one/i }).getAttribute('href')).toBe(
      '/jobseeker/resumes?returnTo=%2Fjobs%2Fbackend-engineer%2Fapply',
    );
  });
});

describe('ResumeBuilderForm Remove', () => {
  it('moves focus to the next entry, then to "Add work experience"', async () => {
    render(
      <ResumeBuilderForm
        initialEntries={[
          { company: 'Acme', title: 'Engineer', startDate: '', endDate: '', description: '' },
          { company: 'Globex', title: 'Analyst', startDate: '', endDate: '', description: '' },
        ]}
      />,
    );
    const [first, second] = screen.getAllByRole('button', { name: 'Remove' });
    await userEvent.click(first!);
    expect(document.activeElement).toBe(second);
    await userEvent.click(second!);
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: /add work experience/i }),
    );
  });
});
