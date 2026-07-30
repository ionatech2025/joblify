'use client';

import { useEffect } from 'react';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useUiStore, type Toast, type ToastTone } from '@/lib/stores/ui';
import { cn } from '@/lib/cn';

// Hand-rolled on the existing zustand store rather than pulling in a toast
// library — the store, the portal-free fixed container and a timeout are the
// whole feature, and it keeps the client bundle flat.

const AUTO_DISMISS_MS = 5000;

const tones: Record<ToastTone, { icon: typeof Info; className: string }> = {
  success: { icon: CheckCircle2, className: 'text-success' },
  error: { icon: XCircle, className: 'text-danger' },
  info: { icon: Info, className: 'text-brand' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useUiStore((s) => s.dismissToast);
  const { icon: Icon, className } = tones[toast.tone];

  useEffect(() => {
    // Errors stay until dismissed — they usually carry an action the user has
    // to read. Success/info self-clear.
    if (toast.tone === 'error') return;
    const timer = setTimeout(() => dismissToast(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, toast.tone, dismissToast]);

  return (
    <div className="border-border bg-surface shadow-raised rounded-card pointer-events-auto flex w-full items-start gap-3 border p-3.5">
      <Icon aria-hidden className={cn('mt-0.5 size-4 shrink-0', className)} />
      <div className="min-w-0 flex-1">
        <p className="text-fg m-0 text-sm font-semibold">{toast.title}</p>
        {toast.description ? (
          <p className="text-fg-muted m-0 mt-0.5 text-sm">{toast.description}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => dismissToast(toast.id)}
        aria-label="Dismiss notification"
        className="text-fg-subtle hover:text-fg focus-visible:ring-brand -m-1 shrink-0 rounded-full p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    // aria-live on the always-present container (not on each toast) is what
    // makes additions announce: a live region has to exist in the DOM before
    // the content lands in it. `polite` so it never interrupts.
    <div
      role="status"
      aria-live="polite"
      aria-relevant="additions text"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[70] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-88 sm:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
