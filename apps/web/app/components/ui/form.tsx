'use client';

import {
  cloneElement,
  forwardRef,
  isValidElement,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

// Shared form-control primitives. forwardRef so React Hook Form's register()
// can attach its ref; spread props pass name/onChange/onBlur straight through.
const controlBase =
  'w-full rounded-control border border-border-strong bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-brand focus:ring-2 focus:ring-brand/25 focus:outline-none disabled:bg-surface-sunken disabled:text-fg-subtle';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlBase, className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(controlBase, className)} {...props}>
        {children}
      </select>
    );
  },
);

// Aria props Field injects into its (single-element) control child.
type FieldControlProps = {
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  // Programmatically associate the control with its error: the error line gets
  // a stable id + role="alert" (announced on appearance), and the control gets
  // aria-invalid plus an aria-describedby pointing at it — appended after any
  // describedby the call site already set, which is preserved.
  const base = useId();
  const errorId = `${base}-error`;
  const hintId = `${base}-hint`;
  const control = isValidElement<FieldControlProps>(children)
    ? cloneElement(children, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby':
          [
            children.props['aria-describedby'],
            hint ? hintId : undefined,
            error ? errorId : undefined,
          ]
            .filter(Boolean)
            .join(' ') || undefined,
      })
    : children;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-fg text-sm font-medium">{label}</span>
      {hint && (
        <span id={hintId} className="text-fg-subtle text-xs">
          {hint}
        </span>
      )}
      {control}
      {error && (
        <span id={errorId} role="alert" className="text-danger text-sm">
          {error}
        </span>
      )}
    </label>
  );
}

/**
 * Checkbox with its own inline label. The native input stays in the tree
 * (`peer`, visually hidden but focusable) so keyboard, form submission and
 * RHF's register() all behave natively; the visible box is a sibling.
 */
export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }
>(function Checkbox({ label, className, ...props }, ref) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm', className)}>
      <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="border-border-strong text-ink-fg peer-checked:bg-ink peer-checked:border-ink peer-focus-visible:ring-brand peer-focus-visible:ring-offset-canvas mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-[0.375rem] border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 [&>svg]:opacity-0 peer-checked:[&>svg]:opacity-100"
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className="text-fg peer-disabled:text-fg-subtle">{label}</span>
    </label>
  );
});

export const Radio = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: ReactNode }
>(function Radio({ label, className, ...props }, ref) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm', className)}>
      <input ref={ref} type="radio" className="peer sr-only" {...props} />
      <span
        aria-hidden
        className="border-border-strong peer-checked:border-ink peer-focus-visible:ring-brand peer-focus-visible:ring-offset-canvas mt-0.5 grid size-[1.125rem] shrink-0 place-items-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 [&>span]:opacity-0 peer-checked:[&>span]:opacity-100"
      >
        <span className="bg-ink size-2.5 rounded-full transition-opacity" />
      </span>
      <span className="text-fg peer-disabled:text-fg-subtle">{label}</span>
    </label>
  );
});

/**
 * Sliding on/off switch. `role="switch"` on a real checkbox keeps it operable
 * by keyboard and announced correctly without any JS state of its own.
 */
export const Switch = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'role'> & { label: ReactNode }
>(function Switch({ label, className, ...props }, ref) {
  return (
    <label className={cn('flex cursor-pointer items-center gap-3 text-sm', className)}>
      <input ref={ref} type="checkbox" role="switch" className="peer sr-only" {...props} />
      {/* The knob is a DESCENDANT of this span, not a sibling of the input, so
          its checked style has to be written as peer-checked:[&>span]:… */}
      <span
        aria-hidden
        className="bg-border-strong peer-checked:bg-ink peer-focus-visible:ring-brand peer-focus-visible:ring-offset-canvas relative h-6 w-11 shrink-0 rounded-full transition-colors peer-checked:[&>span]:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50"
      >
        <span className="bg-surface absolute top-0.5 left-0.5 size-5 rounded-full shadow-sm transition-transform" />
      </span>
      <span className="text-fg">{label}</span>
    </label>
  );
});
