'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type NotebookTab = {
  id: string;
  label: string;
  content: ReactNode;
  /** Small trailing count/marker — e.g. how many skills a tab holds. */
  badge?: ReactNode;
};

/**
 * Notebook — the tab strip at the foot of an Odoo form sheet. Sections of one
 * record that you don't need at the same time (a job's description vs. its
 * compensation vs. its screening questions) stop being 400px of scroll each and
 * become one keystroke apart.
 *
 * Full WAI-ARIA tabs behaviour: roving tabindex, Left/Right to move, Home/End
 * to jump, and the panel is only rendered for the selected tab so a hidden tab
 * costs nothing. Focus follows selection, which is the correct pattern for tabs
 * whose panels are cheap to render.
 */
export function Notebook({
  tabs,
  defaultTab,
  className,
}: {
  tabs: NotebookTab[];
  defaultTab?: string;
  className?: string;
}) {
  const base = useId();
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? '');
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === active),
  );

  function move(to: number) {
    const next = tabs[(to + tabs.length) % tabs.length];
    if (!next) return;
    setActive(next.id);
    refs.current[next.id]?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault();
        move(activeIndex + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        move(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        move(0);
        break;
      case 'End':
        e.preventDefault();
        move(tabs.length - 1);
        break;
    }
  }

  const current = tabs[activeIndex];

  return (
    <div className={cn('mt-5', className)}>
      <div
        role="tablist"
        aria-label="Record sections"
        onKeyDown={onKeyDown}
        className="border-border flex flex-wrap items-stretch gap-0 border-b"
      >
        {tabs.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              ref={(el) => {
                refs.current[t.id] = el;
              }}
              type="button"
              role="tab"
              id={`${base}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(t.id)}
              className={cn(
                // -mb-px drops the active tab's underline onto the strip's own
                // border so the selected tab reads as joined to its panel.
                'focus-visible:ring-brand -mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-[13px] transition-colors focus-visible:ring-2 focus-visible:outline-none',
                selected
                  ? 'border-brand text-fg font-semibold'
                  : 'text-fg-muted hover:text-fg hover:border-border-strong border-transparent',
              )}
            >
              {t.label}
              {t.badge != null ? (
                <span className="bg-surface-sunken text-fg-muted rounded-pill px-1.5 text-[11px] font-semibold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {current ? (
        <div
          role="tabpanel"
          id={`${base}-panel-${current.id}`}
          aria-labelledby={`${base}-tab-${current.id}`}
          tabIndex={0}
          className="focus-visible:ring-brand pt-4 focus-visible:ring-2 focus-visible:outline-none"
        >
          {current.content}
        </div>
      ) : null}
    </div>
  );
}
