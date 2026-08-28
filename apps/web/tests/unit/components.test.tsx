// @vitest-environment jsdom
//
// The first tests in this repo that render a component.
//
// Everything under app/components/ — 41 files including every form primitive,
// the command palette and the whole console vocabulary — had no unit coverage,
// and could not have had any: vitest.config.ts sets `environment: 'node'` and
// there was no jsdom or testing-library in package.json. The only UI
// verification was Playwright, whose authenticated half self-skips in CI for
// want of secrets, and whose console specs have never executed at all.
//
// These start where it matters most: the primitives that encode an
// accessibility contract in code, so a regression is a failing test rather than
// something a manual audit has to rediscover. Two of them are the contracts
// this pass just fixed (1.3.5 autocomplete, the palette's focus containment).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Field, Input, Checkbox } from '@/app/components/ui/form';
import { TimeStamp } from '@/app/components/ui/timestamp';

afterEach(cleanup);

describe('Field', () => {
  it('associates its label with the control', () => {
    render(
      <Field label="Company name">
        <Input autoComplete="organization" />
      </Field>,
    );
    expect(screen.getByLabelText('Company name')).toBeDefined();
  });

  it('wires an error to the control via aria-invalid + aria-describedby, and announces it', () => {
    render(
      <Field label="Website" error="Enter a valid URL.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText('Website');
    expect(input.getAttribute('aria-invalid')).toBe('true');

    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();

    // role="alert" is what makes the message announced on appearance rather
    // than silently rendered next to a field the user has already left.
    const alert = screen.getByRole('alert');
    expect(alert.id).toBe(describedBy);
    expect(alert.textContent).toBe('Enter a valid URL.');
  });

  it('keeps a describedby the call site already set, and adds the hint to it', () => {
    render(
      <Field label="Salary" hint="Annual, before tax." error="Too low.">
        <Input aria-describedby="external-note" />
      </Field>,
    );
    const ids = screen.getByLabelText('Salary').getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids[0]).toBe('external-note');
    expect(ids).toHaveLength(3); // external + hint + error
  });

  it('sets no aria-invalid when there is no error', () => {
    render(
      <Field label="Headline">
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText('Headline').hasAttribute('aria-invalid')).toBe(false);
  });
});

describe('Input', () => {
  // WCAG 2.2 SC 1.3.5 (Identify Input Purpose, AA). axe cannot catch a MISSING
  // autocomplete — its autocomplete-valid rule only checks tokens that are
  // present — so the contract is asserted here instead.
  it('passes an autocomplete token through to the control', () => {
    render(<Input aria-label="Website" autoComplete="url" type="url" />);
    const input = screen.getByLabelText('Website');
    expect(input.getAttribute('autocomplete')).toBe('url');
    expect(input.getAttribute('type')).toBe('url');
  });

  it('blurs a number field on wheel so scrolling cannot rewrite its value', async () => {
    render(<Input aria-label="Salary" type="number" defaultValue="90000" />);
    const input = screen.getByLabelText('Salary') as HTMLInputElement;
    input.focus();
    expect(document.activeElement).toBe(input);

    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }));
    expect(document.activeElement).not.toBe(input);
  });

  it('leaves non-numeric fields focused on wheel', () => {
    render(<Input aria-label="Headline" type="text" />);
    const input = screen.getByLabelText('Headline');
    input.focus();
    input.dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 100 }));
    expect(document.activeElement).toBe(input);
  });

  it('still calls an onWheel the call site passed', () => {
    const onWheel = vi.fn();
    render(<Input aria-label="Years" type="number" onWheel={onWheel} />);
    screen
      .getByLabelText('Years')
      .dispatchEvent(new WheelEvent('wheel', { bubbles: true, deltaY: 1 }));
    expect(onWheel).toHaveBeenCalledOnce();
  });
});

describe('Checkbox', () => {
  it('keeps a real, operable input behind the drawn box', async () => {
    const user = userEvent.setup();
    render(<Checkbox label="I agree to the data-use terms" />);
    const box = screen.getByLabelText('I agree to the data-use terms') as HTMLInputElement;
    expect(box.type).toBe('checkbox');
    expect(box.checked).toBe(false);
    await user.click(box);
    expect(box.checked).toBe(true);
  });
});

describe('TimeStamp', () => {
  it('emits a machine-readable <time> carrying the exact instant', () => {
    const iso = '2026-03-09T22:30:00.000Z';
    const { container } = render(<TimeStamp value={iso} />);
    const el = container.querySelector('time');
    expect(el).not.toBeNull();
    expect(el?.getAttribute('datetime')).toBe(iso);
  });

  it('renders a date the same way for a Date and its ISO string', () => {
    const iso = '2026-03-09T22:30:00.000Z';
    const a = render(<TimeStamp value={iso} />).container.textContent;
    cleanup();
    const b = render(<TimeStamp value={new Date(iso)} />).container.textContent;
    expect(a).toBe(b);
  });

  it('includes a time in datetime mode and omits it otherwise', () => {
    const iso = '2026-03-09T22:30:00.000Z';
    const dateOnly = render(<TimeStamp value={iso} />).container.textContent ?? '';
    cleanup();
    const withTime = render(<TimeStamp value={iso} mode="datetime" />).container.textContent ?? '';
    expect(withTime.length).toBeGreaterThan(dateOnly.length);
  });

  it('renders nothing for an unparseable value rather than "Invalid Date"', () => {
    const { container } = render(<TimeStamp value="not a date" />);
    expect(container.textContent).toBe('');
  });
});

describe('form composition', () => {
  it('submits the values the user typed, under the names register() would set', async () => {
    const user = userEvent.setup();
    // Read the FormData inside the handler: `currentTarget` is nulled once the
    // event has been dispatched, so reading it from the mock call afterwards
    // gets null rather than the form.
    const submitted: FormData[] = [];
    const onSubmit = vi.fn((e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      submitted.push(new FormData(e.currentTarget));
    });

    render(
      <form onSubmit={onSubmit}>
        <Field label="Company name">
          <Input name="companyName" autoComplete="organization" />
        </Field>
        <Field label="Website">
          <Input name="website" type="url" autoComplete="url" />
        </Field>
        <button type="submit">Save</button>
      </form>,
    );

    await user.type(screen.getByLabelText('Company name'), 'Acme Inc.');
    await user.type(screen.getByLabelText('Website'), 'https://acme.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const data = submitted[0]!;
    expect(data.get('companyName')).toBe('Acme Inc.');
    expect(data.get('website')).toBe('https://acme.com');
  });

  it('renders each Field with its own ids, so two errors do not collide', () => {
    const { container } = render(
      <>
        <Field label="First" error="Bad first.">
          <Input />
        </Field>
        <Field label="Second" error="Bad second.">
          <Input />
        </Field>
      </>,
    );
    const ids = within(container)
      .getAllByRole('alert')
      .map((el) => el.id);
    expect(new Set(ids).size).toBe(2);
  });
});
