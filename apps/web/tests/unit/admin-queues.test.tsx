// @vitest-environment jsdom
//
// The admin trust & safety queues on /admin: what an admin sees before
// deciding, the reason a destructive decision requires, and where keyboard
// focus lands once a decided row leaves the list (WCAG 2.4.3).

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VerificationQueue, type PendingCompany } from '@/app/admin/verification-queue';
import { JobReportsQueue, type OpenReport } from '@/app/admin/job-reports';

const m = vi.hoisted(() => ({
  verifyCompany: vi.fn(),
  resolveJobReport: vi.fn(),
  requireRole: vi.fn(),
  companyFindMany: vi.fn(),
  reportFindMany: vi.fn(),
  userCount: vi.fn(),
  jobCount: vi.fn(),
}));
vi.mock('@/app/actions/admin', () => ({
  verifyCompany: m.verifyCompany,
  resolveJobReport: m.resolveJobReport,
}));
vi.mock('@/lib/auth', () => ({ requireRole: m.requireRole }));
vi.mock('@/lib/db', () => ({
  db: {
    companyProfile: { findMany: m.companyFindMany },
    jobReport: { findMany: m.reportFindMany },
    user: { count: m.userCount },
    jobPost: { count: m.jobCount },
  },
}));

const company = (id: string, name: string): PendingCompany => ({
  id,
  companyName: name,
  industry: 'TECHNOLOGY',
  companySize: 'SIZE_11_50',
  description: `${name} builds warehouse robots.`,
  website: `https://${id}.example`,
  address: 'Plot 4, Kampala Road',
  phone: '+256700000001',
  contactPersonName: 'Grace Achieng',
  contactPersonPosition: 'Founder',
  createdAt: '2026-11-01T09:00:00.000Z',
});

const report = (id: string, title: string): OpenReport => ({
  id,
  reason: 'SCAM',
  details: null,
  createdAt: '2026-11-01T09:00:00.000Z',
  jobTitle: title,
  jobSlug: id,
  companyName: 'Shady LLC',
});

function withHeading(ui: React.ReactNode) {
  return (
    <>
      <h2 id="queue-heading" tabIndex={-1}>
        Queue
      </h2>
      {ui}
    </>
  );
}

beforeEach(() => {
  m.verifyCompany.mockResolvedValue({ ok: true, data: undefined });
  m.resolveJobReport.mockResolvedValue({ ok: true, data: undefined });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('VerificationQueue', () => {
  it('shows what an admin checks before vouching for a company', () => {
    render(<VerificationQueue headingId="queue-heading" initial={[company('a', 'Acme')]} />);
    expect(screen.getByText('Acme builds warehouse robots.')).toBeDefined();
    expect(screen.getByText('Grace Achieng, Founder')).toBeDefined();
    expect(screen.getByText('+256700000001')).toBeDefined();
    expect(screen.getByText('Plot 4, Kampala Road')).toBeDefined();
    expect(screen.getByRole('link', { name: 'a.example' }).getAttribute('href')).toBe(
      'https://a.example',
    );
  });

  it('asks for a reason before rejecting, then moves focus to the next row', async () => {
    const user = userEvent.setup();
    render(
      withHeading(
        <VerificationQueue
          headingId="queue-heading"
          initial={[company('a', 'Acme'), company('b', 'Beta')]}
        />,
      ),
    );
    await user.click(screen.getAllByRole('button', { name: 'Reject' })[0]!);
    const reason = screen.getByRole('textbox', { name: 'Reason for rejecting Acme' });
    expect(document.activeElement).toBe(reason);
    const form = within(reason.closest('form')!);

    await user.click(form.getByRole('button', { name: 'Reject' }));
    expect((await screen.findByRole('alert')).textContent).toBe('Enter a reason.');
    expect(m.verifyCompany).not.toHaveBeenCalled();

    await user.type(reason, 'Website does not resolve');
    await user.click(form.getByRole('button', { name: 'Reject' }));
    expect(m.verifyCompany).toHaveBeenCalledWith('a', 'REJECTED', 'Website does not resolve');
    expect(screen.queryByText('Acme')).toBeNull();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Verify' }));
    expect(within(document.activeElement!.closest('tr')!).getByText('Beta')).toBeDefined();
  });

  it('returns focus to Reject when the reason is cancelled', async () => {
    const user = userEvent.setup();
    render(<VerificationQueue headingId="queue-heading" initial={[company('a', 'Acme')]} />);
    await user.click(screen.getByRole('button', { name: 'Reject' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Reject' }));
  });

  it('moves focus to the list heading when the last company is decided', async () => {
    const user = userEvent.setup();
    render(
      withHeading(<VerificationQueue headingId="queue-heading" initial={[company('a', 'Acme')]} />),
    );
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect(m.verifyCompany).toHaveBeenCalledWith('a', 'VERIFIED', undefined);
    expect(screen.getByText('Verification queue is clear')).toBeDefined();
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Queue' }));
  });

  it('puts the row back and says why when the server refuses', async () => {
    const user = userEvent.setup();
    m.verifyCompany.mockResolvedValue({
      ok: false,
      error: 'Acme was already reviewed. Reload the page to see the queue.',
    });
    render(<VerificationQueue headingId="queue-heading" initial={[company('a', 'Acme')]} />);
    await user.click(screen.getByRole('button', { name: 'Verify' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/already reviewed/);
    expect(screen.getByText('Acme')).toBeDefined();
  });
});

describe('JobReportsQueue', () => {
  it('requires a reason to remove a job and focuses the next report', async () => {
    const user = userEvent.setup();
    render(
      withHeading(
        <JobReportsQueue
          headingId="queue-heading"
          initial={[report('r1', 'Fake Data Entry'), report('r2', 'Easy Money')]}
        />,
      ),
    );
    await user.click(screen.getAllByRole('button', { name: 'Remove job' })[0]!);
    const reason = screen.getByRole('textbox', { name: 'Reason for removing Fake Data Entry' });
    await user.type(reason, 'Asks for a registration fee');
    await user.click(within(reason.closest('form')!).getByRole('button', { name: 'Remove job' }));
    expect(m.resolveJobReport).toHaveBeenCalledWith(
      'r1',
      'ACTIONED',
      'Asks for a registration fee',
    );
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Dismiss' }));
    expect(within(document.activeElement!.closest('tr')!).getByText('Easy Money')).toBeDefined();
  });

  it('focuses the previous report when the last row is dismissed', async () => {
    const user = userEvent.setup();
    render(
      <JobReportsQueue
        headingId="queue-heading"
        initial={[report('r1', 'Fake Data Entry'), report('r2', 'Easy Money')]}
      />,
    );
    await user.click(screen.getAllByRole('button', { name: 'Dismiss' })[1]!);
    expect(m.resolveJobReport).toHaveBeenCalledWith('r2', 'DISMISSED', undefined);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Dismiss' }));
    expect(
      within(document.activeElement!.closest('tr')!).getByText('Fake Data Entry'),
    ).toBeDefined();
  });
});

describe('AdminPage', () => {
  it('lists each platform metric term before its value, and passes the owner phone to the queue', async () => {
    m.requireRole.mockResolvedValue({ id: 'admin1' });
    const { createdAt, phone, ...rest } = company('a', 'Acme');
    m.companyFindMany.mockResolvedValue([
      { ...rest, createdAt: new Date(createdAt), user: { phone } },
    ]);
    m.reportFindMany.mockResolvedValue([]);
    m.userCount.mockResolvedValue(1200);
    m.jobCount.mockResolvedValue(30);
    const { default: AdminPage } = await import('@/app/admin/page');
    const { container } = render(await AdminPage());

    const pairs = [...container.querySelectorAll('dl')[0]!.children].map((div) =>
      [...div.children].map((el) => `${el.tagName}:${el.textContent}`),
    );
    expect(pairs[0]).toEqual(['DT:Jobseekers', 'DD:1,200']);
    expect(screen.getByText('+256700000001')).toBeDefined();
  });
});
