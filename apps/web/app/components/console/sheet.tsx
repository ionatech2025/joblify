import { cloneElement, isValidElement, useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * The form sheet — Odoo's record "paper". A white sheet on the gray desk,
 * holding a title zone, label:value groups, and a notebook of related detail.
 *
 * The problem it solves here: every form in the console (post a job, edit a
 * job, company settings, jobseeker profile) was one long single-column stack of
 * stacked-label fields. On a 900px viewport that put the submit button several
 * screens below the first field with no structure in between and nothing to
 * scan for. Grouping into two columns of label:value pairs roughly halves the
 * height and makes the shape of the record legible at a glance.
 */
export function FormSheet({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('o-sheet px-4 py-4 sm:px-6 sm:py-5', className)}>{children}</div>;
}

/**
 * The record's identity zone: the headline field (or plain title) on the left,
 * the statusbar on the right. Always the first thing in a sheet.
 */
export function SheetTitle({
  title,
  subtitle,
  aside,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Statusbar, or a small cluster of record-level buttons. */
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-border mb-4 flex flex-wrap items-start justify-between gap-x-6 gap-y-3 border-b pb-4',
        className,
      )}
    >
      <div className="min-w-0">
        <div className="text-fg text-lg leading-tight font-semibold">{title}</div>
        {subtitle ? <div className="text-fg-muted mt-1 text-[13px]">{subtitle}</div> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </div>
  );
}

/** Two-column container for `SheetGroup`s. Collapses to one below `md`. */
export function SheetGroups({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid grid-cols-1 gap-x-10 gap-y-5 md:grid-cols-2', className)}>
      {children}
    </div>
  );
}

/**
 * A named group of fields. The title is a small underlined caption, not a
 * heading with 24px of margin — grouping should cost almost no vertical space,
 * which is the whole reason the pattern works in Odoo.
 */
export function SheetGroup({
  title,
  children,
  className,
  /** Span both columns — for a group of full-width fields (rich text, lists). */
  wide = false,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  wide?: boolean;
}) {
  return (
    <section className={cn(wide && 'md:col-span-2', className)}>
      {title ? (
        <h3 className="border-border text-fg mb-2.5 border-b pb-1 text-[13px] font-semibold">
          {title}
        </h3>
      ) : null}
      <div className="flex flex-col gap-2.5">{children}</div>
    </section>
  );
}

type FieldControlProps = {
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

/**
 * A label:value row. Prop-compatible with `Field` from `components/ui/form.tsx`
 * — same `label` / `error` / `hint` contract, same programmatic association
 * (stable error id + role="alert", `aria-invalid` and `aria-describedby` cloned
 * onto the control) — so a form adopts the sheet layout by changing its import,
 * not by being rewritten field by field.
 *
 * The difference is geometry: label in a fixed left column, control in the
 * right, stacking below `sm` where a two-column row would leave ~12ch for the
 * input.
 */
export function SheetField({
  label,
  error,
  hint,
  required = false,
  wide = false,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  /** Renders the required marker and sets aria-required on the control. */
  required?: boolean;
  /** Label above the control instead of beside it — for textareas and editors. */
  wide?: boolean;
  children: ReactNode;
}) {
  const base = useId();
  const errorId = `${base}-error`;
  const hintId = `${base}-hint`;
  const control = isValidElement<FieldControlProps>(children)
    ? cloneElement(children, {
        'aria-invalid': error ? true : undefined,
        'aria-required': required || undefined,
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
    <label
      className={cn(
        'gap-x-3 gap-y-1',
        wide
          ? 'flex flex-col'
          : 'grid grid-cols-1 items-baseline sm:grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)]',
      )}
    >
      <span className="text-fg-muted pt-1.5 text-[13px] font-medium">
        {label}
        {required ? (
          <span aria-hidden className="text-danger ml-0.5">
            *
          </span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-col gap-1">
        {control}
        {hint ? (
          <span id={hintId} className="text-fg-subtle text-[12px]">
            {hint}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} role="alert" className="text-danger text-[12px]">
            {error}
          </span>
        ) : null}
      </span>
    </label>
  );
}
