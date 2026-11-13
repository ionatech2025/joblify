'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Field, Textarea } from '@/app/components/ui/form';

/**
 * Where focus goes once `id` leaves a queue (WCAG 2.4.3): the next row's first
 * action, else the previous row's, else the list heading. Without this a
 * keyboard user who decides a row lands on <body>.
 */
export function focusAfterRemoving<T extends { id: string }>(
  rows: T[],
  id: string,
  firstActionId: (row: T) => string,
  headingId: string,
): string {
  const i = rows.findIndex((r) => r.id === id);
  const rest = rows.filter((r) => r.id !== id);
  const next = rest[i] ?? rest[i - 1];
  return next ? firstActionId(next) : headingId;
}

/** Focus an element by id after the render that (re)mounts it. */
export function useFocusAfterRender(): (elementId: string) => void {
  const pending = useRef<string | null>(null);
  useEffect(() => {
    if (pending.current === null) return;
    document.getElementById(pending.current)?.focus();
    pending.current = null;
  });
  return useCallback((elementId: string) => {
    pending.current = elementId;
  }, []);
}

/** The required free-text reason an admin gives for a destructive decision. */
export function ReasonForm({
  label,
  hint,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  label: string;
  hint: string;
  submitLabel: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | undefined>();
  useEffect(() => ref.current?.focus(), []);

  return (
    <form
      noValidate
      className="ml-auto flex w-72 max-w-full flex-col gap-2 text-left"
      onSubmit={(e) => {
        e.preventDefault();
        const text = reason.trim();
        if (text) onSubmit(text);
        else setError('Enter a reason.');
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onCancel();
      }}
    >
      <Field label={label} hint={hint} error={error} required>
        <Textarea
          ref={ref}
          rows={3}
          maxLength={1000}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <div className="flex justify-end gap-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" size="sm">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
