// @vitest-environment jsdom

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import type { ApplicationStatus } from '@prisma/client';

const m = vi.hoisted(() => ({ updateStatus: vi.fn(), saveNote: vi.fn() }));
vi.mock('@/app/actions/update-applicant-status', () => ({
  updateApplicantStatus: m.updateStatus,
  saveApplicantNote: m.saveNote,
}));

import { ApplicantsBoard } from '@/app/company/applicants/[jobId]/applicants-board';

function row(id: string, firstName: string, status: ApplicationStatus = 'SUBMITTED') {
  return {
    id,
    status,
    appliedAt: '2026-11-01T00:00:00.000Z',
    matchScore: null,
    coverLetter: null,
    recruiterNotes: null as string | null,
    resumeUrl: `/api/v1/resumes/${id}/file`,
    seeker: { id: `s-${id}`, firstName, lastName: null, email: `${id}@x.test`, headline: null },
  };
}

const column = (name: string) => screen.getByRole('region', { name: new RegExp(`^${name},`) });
const stageControl = (id: string) => document.querySelector(`[data-stage-control="${id}"]`);

beforeEach(() => {
  m.updateStatus.mockResolvedValue({ ok: true, data: undefined });
  m.saveNote.mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ApplicantsBoard', () => {
  it('keeps a just-saved note when the card moves to another column', async () => {
    const user = userEvent.setup();
    let settle!: () => void;
    const inFlight = new Promise<void>((resolve) => (settle = resolve));
    m.saveNote.mockReturnValue(inFlight);
    m.updateStatus.mockReturnValue(inFlight.then(() => ({ ok: true, data: undefined })));
    render(<ApplicantsBoard applications={[row('a', 'Ada'), row('b', 'Bo')]} showClosed={false} />);

    await user.type(screen.getByRole('textbox', { name: 'Notes for Ada' }), 'Strong Go background');
    await user.click(screen.getByRole('button', { name: 'Advance Ada to Viewed' }));

    expect(m.saveNote).toHaveBeenCalledWith('a', 'Strong Go background');
    const moved = within(column('Viewed')).getByRole('textbox', { name: 'Notes for Ada' });
    expect((moved as HTMLTextAreaElement).value).toBe('Strong Go background');
    // React entangles every pending transition; leaving these open would hold
    // the next test's transitions open too.
    await act(async () => settle());
  });

  it('shows the server rows it is handed, without a reload', () => {
    const { rerender } = render(
      <ApplicantsBoard applications={[row('a', 'Ada')]} showClosed={false} />,
    );
    const saved = { ...row('a', 'Ada', 'SHORTLISTED'), recruiterNotes: 'Call Tuesday' };
    rerender(<ApplicantsBoard applications={[row('c', 'Cy'), saved]} showClosed={false} />);

    expect(within(column('New')).getByText('Cy')).toBeTruthy();
    const ada = within(column('Shortlisted')).getByRole('textbox', { name: 'Notes for Ada' });
    expect((ada as HTMLTextAreaElement).value).toBe('Call Tuesday');
  });

  // Next answers a revalidating action with the refreshed page in the same
  // response, so the new props and the action's result commit together.
  function serverAction(rerender: (ui: ReactElement) => void) {
    let finish!: (rows: ReturnType<typeof row>[]) => Promise<void>;
    m.updateStatus.mockReturnValue(
      new Promise((resolve) => {
        finish = (rows) =>
          act(async () => {
            rerender(<ApplicantsBoard applications={rows} showClosed={false} />);
            resolve({ ok: true, data: undefined });
          });
      }),
    );
    return (rows: ReturnType<typeof row>[]) => finish(rows);
  }

  it("puts focus on the moved card's stage control, and keeps it there", async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <ApplicantsBoard applications={[row('a', 'Ada'), row('b', 'Bo')]} showClosed={false} />,
    );
    const respond = serverAction(rerender);

    await user.click(screen.getByRole('button', { name: 'Advance Ada to Viewed' }));
    expect(within(column('Viewed')).getByText('Ada')).toBeTruthy();
    expect(document.activeElement).toBe(stageControl('a'));

    await respond([row('a', 'Ada', 'VIEWED'), row('b', 'Bo')]);
    expect(within(column('Viewed')).getByText('Ada')).toBeTruthy();
    expect(document.activeElement).toBe(stageControl('a'));
  });

  it('moves focus to the next card when a rejected card leaves the board', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { rerender } = render(
      <ApplicantsBoard applications={[row('a', 'Ada'), row('b', 'Bo')]} showClosed={false} />,
    );
    const respond = serverAction(rerender);

    (stageControl('a') as HTMLElement).focus();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'Rejected' }));

    expect(window.confirm).toHaveBeenCalledWith(expect.stringMatching(/move them back later/));
    expect(m.updateStatus).toHaveBeenCalledWith('a', 'REJECTED');
    expect(screen.queryByText('Ada')).toBeNull();
    expect(document.activeElement).toBe(stageControl('b'));

    await respond([row('a', 'Ada', 'REJECTED'), row('b', 'Bo')]);
    expect(screen.queryByText('Ada')).toBeNull();
    expect(document.activeElement).toBe(stageControl('b'));
  });

  it('returns a refused move, and focus, to the original column', async () => {
    const user = userEvent.setup();
    m.updateStatus.mockResolvedValue({ ok: false, error: 'The candidate withdrew.' });
    render(<ApplicantsBoard applications={[row('a', 'Ada'), row('b', 'Bo')]} showClosed={false} />);

    await user.click(screen.getByRole('button', { name: 'Advance Ada to Viewed' }));

    await waitFor(() => expect(within(column('New')).getByText('Ada')).toBeTruthy());
    expect(document.activeElement).toBe(stageControl('a'));
  });
});
