'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  FileText,
  Gauge,
  Info,
  MessageSquare,
  Monitor,
  Moon,
  Search,
  SendHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
} from 'lucide-react';
import { useUiStore } from '@/lib/stores/ui';
import { COMMANDS, filterCommands, withSectionHeaders, type Command } from '@/lib/ui/commands';
import { applyTheme } from '@/lib/ui/theme';
import { EmptyState } from './ui/empty-state';
import { Kbd, KbdHint } from './ui/kbd';

// The catalogue in lib/ui/commands.ts names its icons as strings so it stays
// free of UI imports; this is where those names become components.
const ICONS: Record<string, typeof Search> = {
  Bell,
  Bookmark,
  Briefcase,
  Building2,
  FileText,
  Gauge,
  Info,
  MessageSquare,
  Monitor,
  Moon,
  Search,
  SendHorizontal,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  Users,
};

export function CommandPalette() {
  const open = useUiStore((s) => s.isCommandPaletteOpen);
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);

  // Global shortcut, bound once at the document so it works from any page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUiStore.getState().isCommandPaletteOpen);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setOpen]);

  // The dialog owns query/highlight state and only exists while open, so every
  // open starts clean without an effect resetting state on the `open` edge.
  return open ? <PaletteDialog /> : null;
}

function PaletteDialog() {
  const router = useRouter();
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const setTheme = useUiStore((s) => s.setTheme);

  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreFocusTo = useRef<Element | null>(null);
  const baseId = useId();

  const results = useMemo(() => filterCommands(COMMANDS, query), [query]);
  const rows = useMemo(() => withSectionHeaders(results), [results]);

  useEffect(() => {
    restoreFocusTo.current = document.activeElement;
    inputRef.current?.focus();
    // Stop the page behind the dialog from scrolling.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
      (restoreFocusTo.current as HTMLElement | null)?.focus?.();
    };
  }, []);

  // Keep the highlighted row in view during keyboard traversal.
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  const run = useCallback(
    (command: Command) => {
      setOpen(false);
      if (command.theme) {
        setTheme(command.theme);
        applyTheme(command.theme);
        return;
      }
      if (command.href) router.push(command.href);
    },
    [router, setOpen, setTheme],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(Math.max(0, results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const command = results[active];
      if (command) run(command);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center p-4 pt-[10vh]"
      role="presentation"
      onKeyDown={onKeyDown}
    >
      {/* Backdrop. Escape (handled above) is the keyboard equivalent of clicking
          it, and it is inert to AT via aria-hidden. */}
      <div aria-hidden className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="border-border bg-surface shadow-raised rounded-card relative flex w-full max-w-xl flex-col overflow-hidden border"
      >
        <div className="border-border flex items-center gap-2.5 border-b px-4">
          <Search aria-hidden className="text-fg-subtle size-4 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search pages and actions…"
            aria-label="Search pages and actions"
            role="combobox"
            aria-expanded
            aria-controls={`${baseId}-list`}
            aria-activedescendant={results[active] ? `${baseId}-${results[active].id}` : undefined}
            autoComplete="off"
            className="text-fg placeholder:text-fg-subtle w-full bg-transparent py-3.5 text-sm outline-none"
          />
          <Kbd className="hidden sm:inline-flex">esc</Kbd>
        </div>

        <div className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
          {results.length === 0 ? (
            <EmptyState
              size="sm"
              icon={<Search />}
              title="No results found"
              description={`Nothing matches “${query.trim()}”. Try a shorter search.`}
              className="border-0 bg-transparent"
            />
          ) : (
            <ul
              ref={listRef}
              id={`${baseId}-list`}
              role="listbox"
              aria-label="Results"
              className="m-0 list-none p-0"
            >
              {rows.map(({ command, header }, i) => {
                const Icon = ICONS[command.icon] ?? Search;
                return (
                  <li key={command.id} className="contents">
                    {header ? <p className="caption m-0 px-2 pt-3 pb-1.5">{header}</p> : null}
                    <div
                      id={`${baseId}-${command.id}`}
                      data-index={i}
                      role="option"
                      aria-selected={i === active}
                      onClick={() => run(command)}
                      onMouseMove={() => setActive(i)}
                      className={`flex cursor-pointer items-center gap-3 rounded-[0.625rem] px-2.5 py-2 text-sm ${
                        i === active ? 'bg-surface-sunken text-fg' : 'text-fg-muted'
                      }`}
                    >
                      <Icon aria-hidden className="size-4 shrink-0" />
                      <span className="truncate">{command.label}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="border-border bg-surface-sunken flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-4 py-2.5">
          <KbdHint keys={['↑', '↓']}>navigate</KbdHint>
          <KbdHint keys={['↵']}>open</KbdHint>
          <KbdHint keys={['esc']}>close</KbdHint>
        </div>
      </div>
    </div>
  );
}
