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

// Shared form-control primitives. forwardRef so React Hook Form's register()
// can attach its ref; spread props pass name/onChange/onBlur straight through.
const controlBase =
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 focus:outline-none disabled:bg-neutral-50';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className = '', ...props },
  ref,
) {
  return <input ref={ref} className={`${controlBase} ${className}`} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className = '', ...props },
  ref,
) {
  return <textarea ref={ref} className={`${controlBase} ${className}`} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { className = '', children, ...props },
  ref,
) {
  return (
    <select ref={ref} className={`${controlBase} ${className}`} {...props}>
      {children}
    </select>
  );
});

// Aria props Field injects into its (single-element) control child.
type FieldControlProps = {
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
};

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  // Programmatically associate the control with its error: the error line gets
  // a stable id + role="alert" (announced on appearance), and the control gets
  // aria-invalid plus an aria-describedby pointing at it — appended after any
  // describedby the call site already set (e.g. a hint), which is preserved.
  const errorId = `${useId()}-error`;
  const control = isValidElement<FieldControlProps>(children)
    ? cloneElement(children, {
        'aria-invalid': error ? true : undefined,
        'aria-describedby':
          [children.props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined,
      })
    : children;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {control}
      {error && (
        <span id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </span>
      )}
    </label>
  );
}
