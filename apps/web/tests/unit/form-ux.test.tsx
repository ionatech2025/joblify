// @vitest-environment jsdom
//
// Form UX contracts found by the 2026-10-11 live audit: required semantics on
// the control (not a "*" in the label), validation messages that are inline and
// announced instead of the browser's transient bubble, focus on the first
// problem, and a counter near a length limit.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, Input } from '@/app/components/ui/form';
import { ApplyForm } from '@/app/(marketing)/jobs/[slug]/apply/apply-form';
import { ProfileForm } from '@/app/(authenticated)/jobseeker/profile/profile-form';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';

const submit = vi.hoisted(() => vi.fn());
vi.mock('@/app/actions/apply', () => ({ submitApplication: submit }));
vi.mock('@/app/actions/profile', () => ({ saveProfile: vi.fn().mockResolvedValue(undefined) }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  submit.mockReset();
  localStorage.clear();
  // The drafts are zustand stores with module-level state: clearing
  // localStorage alone leaves the previous test's draft to be restored into the
  // next test's form (it made a no-skills case look like it had skills).
  useProfileDraftStore.getState().clear();
  useApplyDraftStore.getState().clear('job_1');
});

describe('Field required', () => {
  it('puts aria-required on the control and keeps the marker out of the name', () => {
    render(
      <Field label="Bio" required>
        <Input />
      </Field>,
    );
    const input = screen.getByRole('textbox', { name: 'Bio' });
    expect(input.getAttribute('aria-required')).toBe('true');
    // The asterisk is decorative: hidden from the accessibility tree.
    expect(document.querySelector('label span[aria-hidden]')?.textContent).toBe('*');
  });

  it('adds nothing when not required', () => {
    render(
      <Field label="Headline">
        <Input />
      </Field>,
    );
    expect(screen.getByRole('textbox').getAttribute('aria-required')).toBeNull();
  });
});

describe('ApplyForm', () => {
  const props = { jobId: 'job_1', jobSlug: 'frontend', resumes: [{ id: 'r1', title: 'My CV' }] };

  it('opts out of native validation, so its own inline errors are what a person gets', () => {
    const { container } = render(<ApplyForm {...props} />);
    expect(container.querySelector('form')?.noValidate).toBe(true);
  });

  it('reports a missing resume and consent inline, announced, focuses the first, and sends nothing', async () => {
    const user = userEvent.setup();
    render(<ApplyForm {...props} />);
    await user.click(screen.getByRole('button', { name: /submit application/i }));

    const alerts = screen.getAllByRole('alert').map((a) => a.textContent);
    expect(alerts).toContain('Choose the resume to apply with.');
    expect(alerts).toContain('Please confirm you agree before submitting.');
    expect(document.activeElement).toBe(screen.getByRole('combobox', { name: /resume/i }));
    expect(submit).not.toHaveBeenCalled();
  });

  it('marks the resume and consent required for assistive tech', () => {
    render(<ApplyForm {...props} />);
    expect(screen.getByRole('combobox', { name: /resume/i }).getAttribute('aria-required')).toBe(
      'true',
    );
    expect(screen.getByRole('checkbox').getAttribute('aria-required')).toBe('true');
  });

  it('clears a field error as soon as the person fixes it', async () => {
    const user = userEvent.setup();
    render(<ApplyForm {...props} />);
    await user.click(screen.getByRole('button', { name: /submit application/i }));
    expect(screen.queryByText('Please confirm you agree before submitting.')).not.toBeNull();
    await user.click(screen.getByRole('checkbox'));
    expect(screen.queryByText('Please confirm you agree before submitting.')).toBeNull();
  });

  it('says how much of the cover letter is left only near the limit', async () => {
    const user = userEvent.setup();
    render(<ApplyForm {...props} />);
    expect(screen.getByText('Up to 5,000 characters')).not.toBeNull();
    const letter = screen.getByRole('textbox', { name: /cover letter/i });
    await user.click(letter);
    await user.paste('x'.repeat(4600));
    expect(screen.getByText('400 of 5,000 characters left')).not.toBeNull();
  });
});

describe('ProfileForm', () => {
  const initial = {
    profileType: 'EMPLOYABLE' as const,
    headline: '',
    bio: 'A bio.',
    yearsExperience: null,
    location: '',
    phone: '',
    desiredSalaryMin: null,
    desiredSalaryMax: null,
    desiredWorkMode: null,
    visibility: 'PRIVATE' as const,
    careerInterest: '',
    availabilityHoursPerWeek: null,
    learningGoal: '',
    education: 'BSc',
    certifications: '',
    portfolioUrl: '',
    skillSlugs: ['graphic-design'],
  };
  const skills = [{ slug: 'graphic-design', label: 'Graphic Design' }];

  it('shows the schema message inline for a bad URL instead of the browser bubble', async () => {
    const user = userEvent.setup();
    const { container } = render(<ProfileForm initial={initial} allSkills={skills} />);
    expect(container.querySelector('form')?.noValidate).toBe(true);

    await user.type(screen.getByLabelText('Headline'), 'x'); // dirty, so Save enables
    await user.type(screen.getByLabelText('Portfolio / GitHub link'), 'not a url');
    await user.click(screen.getByRole('button', { name: /save profile/i }));

    const msg = await screen.findByText(/Invalid portfolio URL/, {}, { timeout: 5000 });
    expect(msg.getAttribute('role')).toBe('alert');
    expect(screen.getByLabelText('Portfolio / GitHub link').getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('exposes required fields on the control and announces the skills error', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={{ ...initial, skillSlugs: [] }} allSkills={skills} />);
    expect(screen.getByRole('textbox', { name: 'Bio' }).getAttribute('aria-required')).toBe('true');
    expect(screen.getByRole('textbox', { name: 'Education' }).getAttribute('aria-required')).toBe(
      'true',
    );

    await user.type(screen.getByLabelText('Headline'), 'x');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    const err = await screen.findByText(
      'An employable profile must have at least one skill selected.',
      {},
      { timeout: 5000 },
    );
    expect(err.getAttribute('role')).toBe('alert');
    expect(screen.getByRole('group', { name: /skills/i }).getAttribute('aria-describedby')).toBe(
      err.id,
    );
  });
});
