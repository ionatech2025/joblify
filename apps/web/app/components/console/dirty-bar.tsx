'use client';

import { useEffect, type ReactNode } from 'react';
import { AlertCircle, Loader2, RotateCcw, Save } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Unsaved-changes bar — Odoo's sticky save/discard strip.
 *
 * Three real problems it fixes on the console forms:
 *
 *  1. The submit button sat at the bottom of a multi-screen form. Editing a
 *     field near the top meant scrolling to the end to commit it.
 *  2. Nothing told you a form was dirty. These forms already persist a draft to
 *     `localStorage` via the zustand `*-draft` stores, so a half-edited record
 *     survived a reload — but silently, which is worse than not persisting: the
 *     user has no idea there is pending work.
 *  3. Nothing warned on navigating away. `beforeunload` covers tab close and
 *     hard navigation; the discard button covers the intentional case.
 *
 * Rendered inside the sheet, sticky to the bottom of the viewport, so it is
 * reachable from anywhere in the form without a scroll.
 */
export function DirtyBar({
  dirty,
  saving = false,
  onDiscard,
  saveLabel = 'Save',
  savingLabel = 'Saving…',
  /** Form id, so the button can submit a form it is not nested inside. */
  form,
  children,
  className,
}: {
  dirty: boolean;
  saving?: boolean;
  onDiscard?: () => void;
  saveLabel?: string;
  savingLabel?: string;
  form?: string;
  /** Extra controls (e.g. "Save as draft") shown before the primary action. */
  children?: ReactNode;
  className?: string;
}) {
  // Native guard. Only armed while actually dirty and not mid-save, so a
  // successful submit that navigates away doesn't trigger the browser prompt.
  useEffect(() => {
    if (!dirty || saving) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, saving]);

  return (
    <div
      className={cn(
        'o-chrome-bar border-border sticky bottom-0 z-20 -mx-4 mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t px-4 py-2.5 sm:-mx-6 sm:px-6',
        className,
      )}
    >
      <p
        // aria-live so the transition into "unsaved changes" is announced
        // without stealing focus from the field the user is still typing in.
        aria-live="polite"
        className={cn(
          'flex items-center gap-1.5 text-[12px]',
          dirty ? 'text-warn font-medium' : 'text-fg-subtle',
        )}
      >
        {dirty ? (
          <>
            <AlertCircle aria-hidden className="size-3.5" />
            Unsaved changes
          </>
        ) : (
          'All changes saved'
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        {onDiscard ? (
          <button
            type="button"
            onClick={onDiscard}
            disabled={!dirty || saving}
            className="border-border-strong text-fg-muted hover:bg-surface-sunken hover:text-fg focus-visible:ring-brand rounded-control inline-flex items-center gap-1.5 border px-3 py-1.5 text-[13px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RotateCcw aria-hidden className="size-3.5" />
            Discard
          </button>
        ) : null}
        <button
          type="submit"
          form={form}
          disabled={saving}
          aria-busy={saving || undefined}
          className="bg-ink text-ink-fg hover:bg-ink-hover focus-visible:ring-brand focus-visible:ring-offset-canvas rounded-control inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2 aria-hidden className="size-3.5 animate-spin" />
          ) : (
            <Save aria-hidden className="size-3.5" />
          )}
          {saving ? savingLabel : saveLabel}
        </button>
      </div>
    </div>
  );
}
