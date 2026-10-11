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
import { Button } from '@/app/components/ui/button';
import { ApplyForm } from '@/app/(marketing)/jobs/[slug]/apply/apply-form';
import { ProfileForm } from '@/app/(authenticated)/jobseeker/profile/profile-form';
import { useProfileDraftStore } from '@/lib/stores/profile-draft';
import { useApplyDraftStore } from '@/lib/stores/apply-draft';
import { useEmployerSetupDraftStore } from '@/lib/stores/employer-setup-draft';
import { EmployerSetupForm } from '@/app/(authenticated)/employer-setup/employer-setup-form';
import { DeleteForm } from '@/app/(authenticated)/account/delete/delete-form';

const submit = vi.hoisted(() => vi.fn());
vi.mock('@/app/actions/apply', () => ({ submitApplication: submit }));
vi.mock('@/app/actions/profile', () => ({ saveProfile: vi.fn().mockResolvedValue(undefined) }));
const createCompany = vi.hoisted(() => vi.fn());
vi.mock('@/app/actions/company', () => ({ createCompanyProfile: createCompany }));
const deleteAccount = vi.hoisted(() => vi.fn());
vi.mock('@/app/actions/account', () => ({ deleteMyAccount: deleteAccount }));
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
  useEmployerSetupDraftStore.getState().clear();
  createCompany.mockReset();
  deleteAccount.mockReset();
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

describe('Button loading', () => {
  it('keeps focus and blocks activation instead of disabling itself', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Saving…
      </Button>,
    );
    const button = screen.getByRole('button');
    // Not `disabled`: a focused control that disables itself drops keyboard
    // users out of the page.
    expect((button as HTMLButtonElement).disabled).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('aria-busy')).toBe('true');
    button.focus();
    expect(document.activeElement).toBe(button);
    await user.click(button);
    await user.keyboard('{Enter}');
    expect(onClick).not.toHaveBeenCalled();
  });

  it('does not submit a form while loading', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    render(
      <form onSubmit={onSubmit}>
        <Button type="submit" loading>
          Send
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('still honours an explicit disabled, and is inert-free when idle', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    const { rerender } = render(
      <Button disabled onClick={onClick}>
        Go
      </Button>,
    );
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
    rerender(<Button onClick={onClick}>Go</Button>);
    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button').getAttribute('aria-disabled')).toBeNull();
  });
});

describe('ProfileForm skills filter and save', () => {
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
    skillSlugs: ['react'],
  };
  const skills = [
    { slug: 'react', label: 'React' },
    { slug: 'rust', label: 'Rust' },
    { slug: 'figma', label: 'Figma' },
  ];

  it('narrows the list as you type, keeps selections, and says how many match', async () => {
    const user = userEvent.setup();
    render(<ProfileForm initial={initial} allSkills={skills} />);
    expect(screen.getByRole('status').textContent).toContain('1 selected');

    await user.type(screen.getByRole('searchbox', { name: 'Filter skills' }), 'ru');
    expect(screen.getByRole('status').textContent).toContain('1 match');
    // Hidden, not removed: the selected React checkbox is still in the form.
    expect(screen.getByLabelText('React', { selector: 'input' })).toBeDefined();
    expect(
      (screen.getByLabelText('React', { selector: 'input' }) as HTMLInputElement).checked,
    ).toBe(true);
    expect(screen.getByLabelText('Rust').closest('label')?.className).not.toContain('hidden');
    expect(screen.getByLabelText('Figma').closest('label')?.className).toContain('hidden');

    await user.clear(screen.getByRole('searchbox', { name: 'Filter skills' }));
    await user.type(screen.getByRole('searchbox', { name: 'Filter skills' }), 'zzz');
    expect(screen.getByText(/No skill matches/)).toBeDefined();
  });

  it('does not submit the profile when Enter is pressed in the filter', async () => {
    const user = userEvent.setup();
    const { saveProfile } = await import('@/app/actions/profile');
    render(<ProfileForm initial={initial} allSkills={skills} />);
    await user.type(screen.getByRole('searchbox', { name: 'Filter skills' }), 'ru{Enter}');
    expect(saveProfile).not.toHaveBeenCalled();
  });

  it('leaves Save available before anything has changed', () => {
    render(<ProfileForm initial={initial} allSkills={skills} />);
    const save = screen.getByRole('button', { name: /save profile/i }) as HTMLButtonElement;
    expect(save.disabled).toBe(false);
  });

  it('accepts an international phone number', async () => {
    const user = userEvent.setup();
    const { saveProfile } = await import('@/app/actions/profile');
    render(<ProfileForm initial={initial} allSkills={skills} />);
    await user.type(screen.getByLabelText('Phone number'), '+256 743 535 678');
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    await vi.waitFor(() => expect(saveProfile).toHaveBeenCalled(), { timeout: 5000 });
    expect(vi.mocked(saveProfile).mock.calls.at(-1)![0]).toMatchObject({ phone: '+256743535678' });
  });
});

describe('EmployerSetupForm', () => {
  it('opts out of native validation and marks what the schema requires', () => {
    const { container } = render(<EmployerSetupForm hasJobSeekerIdentity={false} />);
    expect(container.querySelector('form')?.noValidate).toBe(true);
    expect(
      screen.getByRole('textbox', { name: 'Company name' }).getAttribute('aria-required'),
    ).toBe('true');
    const about = screen.getByRole('textbox', { name: 'About the company' });
    expect(about.getAttribute('aria-required')).toBe('true');
    // The 20-character floor is said up front, not discovered after submitting.
    expect(screen.getByText(/At least 20 characters/)).toBeDefined();
  });

  it('reports a too-short description inline, as an alert, without calling the server', async () => {
    const user = userEvent.setup();
    render(<EmployerSetupForm hasJobSeekerIdentity={false} />);
    await user.type(screen.getByRole('textbox', { name: 'Company name' }), 'Acme');
    await user.type(screen.getByRole('textbox', { name: 'About the company' }), 'Too short');
    await user.click(screen.getByRole('button', { name: /create company/i }));
    // The hint also says "at least 20 characters"; the error is the alert.
    const alert = await screen.findByRole('alert', {}, { timeout: 10_000 });
    expect(alert.textContent).toMatch(/at least 20 characters/i);
    expect(createCompany).not.toHaveBeenCalled();
  }, 30_000);
});

describe('DeleteForm', () => {
  it('keeps the destructive action disabled until the email matches, then enables it', async () => {
    const user = userEvent.setup();
    render(<DeleteForm expectedConfirmation="me@example.com" />);
    const button = screen.getByRole('button', { name: /delete my account/i }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await user.type(screen.getByRole('textbox'), 'me@example.com');
    expect(button.disabled).toBe(false);
  });

  it('announces a failure as an alert', async () => {
    const user = userEvent.setup();
    deleteAccount.mockResolvedValue({ ok: false, error: 'Could not delete right now.' });
    render(<DeleteForm expectedConfirmation="me@example.com" />);
    await user.type(screen.getByRole('textbox'), 'me@example.com');
    await user.click(screen.getByRole('button', { name: /delete my account/i }));
    const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
    expect(alert.textContent).toContain('Could not delete right now.');
  });
});
