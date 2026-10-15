'use client';

import { useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type NotebookTab = {
  id: string;
  label: string;
  content: ReactNode;
  /** Small trailing count/marker — e.g. how many skills a tab holds. */
  badge?: ReactNode;
  /** Marks the tab as containing a validation error and switches to it if active tab has none. */
  hasError?: boolean;
};

/**
 * Notebook — the tab strip at the foot of an Odoo form sheet. Sections of one
 * record that you don't need at the same time (a job's description vs. its
 * compensation vs. its screening questions) stop being 400px of scroll each and
 * become one keystroke apart.
 *
 * Full WAI-ARIA tabs behaviour: roving tabindex, Left/Right to move, Home/End
 * to jump. Every tabpanel stays mounted in the DOM (with `hidden` on inactive
 * panels) so `aria-controls` always resolves to a real element, form fields
 * keep their registered refs and SSR default values across tab switches, and
 * validation errors in an inactive tab automatically bring that tab into view.
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

  // When a validation error appears in a background tab (e.g. submitting the
  // job form from "Options" while "Description" is too short), switch to the
  // first tab with an error so the inline alert is visible on screen.
  const errorSignature = tabs.map((t) => (t.hasError ? t.id : '')).join('|');
  const [prevErrorSignature, setPrevErrorSignature] = useState(errorSignature);
  if (errorSignature !== prevErrorSignature) {
    setPrevErrorSignature(errorSignature);
    const currentTab = tabs.find((t) => t.id === active);
    const firstErrorTab = tabs.find((t) => t.hasError);
    if (firstErrorTab && !currentTab?.hasError) {
      setActive(firstErrorTab.id);
    }
  }

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

  const currentId = tabs[activeIndex]?.id;

  return (
    <div className={cn('mt-5', className)}>
      <div
        role="tablist"
        aria-label="Record sections"
        onKeyDown={onKeyDown}
        className="border-border flex flex-wrap items-stretch gap-0 border-b"
      >
        {tabs.map((t) => {
          const selected = t.id === currentId;
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
                t.hasError && !selected && 'text-danger',
              )}
            >
              {t.label}
              {t.hasError ? <span aria-hidden className="bg-danger size-1.5 rounded-full" /> : null}
              {t.badge != null ? (
                <span className="bg-surface-sunken text-fg-muted rounded-pill px-1.5 text-[11px] font-semibold">
                  {t.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      {tabs.map((t) => {
        const selected = t.id === currentId;
        return (
          <div
            key={t.id}
            role="tabpanel"
            id={`${base}-panel-${t.id}`}
            aria-labelledby={`${base}-tab-${t.id}`}
            hidden={!selected}
            tabIndex={selected ? 0 : -1}
            className="focus-visible:ring-brand pt-4 focus-visible:ring-2 focus-visible:outline-none"
          >
            {t.content}
          </div>
        );
      })}
    </div>
  );
}
