import { describe, expect, it, beforeEach } from 'vitest';
import { cn } from '@/lib/cn';
import { useUiStore, persistedUiState } from '@/lib/stores/ui';
import { nextTheme, resolvesDark, themeActionLabel } from '@/lib/ui/theme';
import { COMMANDS, filterCommands, withSectionHeaders, type Command } from '@/lib/ui/commands';
import {
  applicationStatusLabel,
  applicationStatusTone,
  matchTone,
  APPLICATION_STAGES,
  CLOSED_APPLICATION_STATUSES,
} from '@/lib/ui/status';

describe('cn', () => {
  it('joins classes and drops falsy values', () => {
    expect(cn('a', false && 'b', undefined, 'c')).toBe('a c');
  });

  it('lets the later (caller) class win on a conflict', () => {
    // This is the whole reason cn() exists: primitives concatenated className
    // naively, so `<Card className="rounded-lg" />` emitted both radii and let
    // stylesheet order decide.
    expect(cn('rounded-card', 'rounded-lg')).toBe('rounded-lg');
    expect(cn('bg-surface p-4', 'bg-surface-sunken')).toBe('p-4 bg-surface-sunken');
  });

  it('keeps non-conflicting utilities from both sides', () => {
    expect(cn('border p-4', 'shadow-soft')).toBe('border p-4 shadow-soft');
  });
});

describe('theme cycle', () => {
  it('leaves system for whichever value is visibly different', () => {
    // The default is 'system'. A plain light→dark→system rotation would make
    // the first click land on the value already on screen and appear inert.
    expect(nextTheme('system', false)).toBe('dark');
    expect(nextTheme('system', true)).toBe('light');
  });

  it('rotates through explicit values back to system', () => {
    expect(nextTheme('light', false)).toBe('dark');
    expect(nextTheme('dark', false)).toBe('system');
  });

  it('always produces a different theme than the current one', () => {
    for (const prefersDark of [true, false]) {
      for (const theme of ['light', 'dark', 'system'] as const) {
        expect(nextTheme(theme, prefersDark)).not.toBe(theme);
      }
    }
  });

  it('leaving system always changes what is on screen', () => {
    // The property that matters to the user: one click, one visible change.
    for (const prefersDark of [true, false]) {
      const before = resolvesDark('system', prefersDark);
      const after = resolvesDark(nextTheme('system', prefersDark), prefersDark);
      expect(after).not.toBe(before);
    }
  });

  it('resolves system against the OS preference', () => {
    expect(resolvesDark('system', true)).toBe(true);
    expect(resolvesDark('system', false)).toBe(false);
    // Explicit choices ignore the OS.
    expect(resolvesDark('dark', false)).toBe(true);
    expect(resolvesDark('light', true)).toBe(false);
  });

  it('labels the action, not the current state', () => {
    expect(themeActionLabel('dark')).toBe('Switch to dark theme');
    expect(themeActionLabel('system')).toBe('Use the system theme');
  });
});

describe('toast store slice', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] });
  });

  it('pushes a toast and returns its id', () => {
    const id = useUiStore.getState().pushToast({ tone: 'success', title: 'Saved' });
    const { toasts } = useUiStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toMatchObject({ id, tone: 'success', title: 'Saved' });
  });

  it('keeps insertion order and gives every toast a distinct id', () => {
    const a = useUiStore.getState().pushToast({ tone: 'info', title: 'First' });
    const b = useUiStore.getState().pushToast({ tone: 'info', title: 'Second' });
    expect(a).not.toBe(b);
    expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['First', 'Second']);
  });

  it('dismisses only the targeted toast', () => {
    const a = useUiStore.getState().pushToast({ tone: 'info', title: 'First' });
    useUiStore.getState().pushToast({ tone: 'error', title: 'Second' });
    useUiStore.getState().dismissToast(a);
    expect(useUiStore.getState().toasts.map((t) => t.title)).toEqual(['Second']);
  });

  it('ignores an unknown id', () => {
    useUiStore.getState().pushToast({ tone: 'info', title: 'Only' });
    useUiStore.getState().dismissToast('nope');
    expect(useUiStore.getState().toasts).toHaveLength(1);
  });

  it('does not persist toasts (only the theme survives a reload)', () => {
    // Ephemeral slices must stay out of storage, or a stale toast — or a
    // stuck-open command palette — reappears on every page load.
    useUiStore.getState().pushToast({ tone: 'info', title: 'Ephemeral' });
    useUiStore.setState({ isCommandPaletteOpen: true, isMobileMenuOpen: true });
    expect(persistedUiState(useUiStore.getState())).toEqual({
      theme: useUiStore.getState().theme,
    });
  });
});

describe('command palette', () => {
  const subject: Command[] = [
    { id: 'a', label: 'Find jobs', section: 'Go to', icon: 'Search', keywords: 'search roles' },
    { id: 'b', label: 'Saved jobs & searches', section: 'Jobseeker', icon: 'Bookmark' },
    { id: 'c', label: 'Post a job', section: 'Company', icon: 'SendHorizontal', keywords: 'hire' },
  ];

  it('returns everything for an empty or whitespace query', () => {
    expect(filterCommands(subject, '')).toHaveLength(3);
    expect(filterCommands(subject, '   ')).toHaveLength(3);
  });

  it('matches the visible label case-insensitively', () => {
    expect(filterCommands(subject, 'SAVED').map((c) => c.id)).toEqual(['b']);
  });

  it('matches hidden keywords', () => {
    expect(filterCommands(subject, 'hire').map((c) => c.id)).toEqual(['c']);
  });

  it('matches the section name', () => {
    expect(filterCommands(subject, 'jobseeker').map((c) => c.id)).toEqual(['b']);
  });

  it('returns nothing for a miss, so the empty state renders', () => {
    expect(filterCommands(subject, 'zzzzz-no-such-command')).toEqual([]);
  });

  it('heads the first row of each section and no others', () => {
    const rows = withSectionHeaders(subject);
    expect(rows.map((r) => r.header)).toEqual(['Go to', 'Jobseeker', 'Company']);

    const grouped = withSectionHeaders([subject[0]!, { ...subject[0]!, id: 'a2' }]);
    expect(grouped.map((r) => r.header)).toEqual(['Go to', null]);
  });

  it('gives every catalogue entry a unique id and an action', () => {
    const ids = COMMANDS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    // A command with neither href nor theme would be a dead row.
    for (const c of COMMANDS) expect(Boolean(c.href || c.theme), c.id).toBe(true);
  });
});

describe('status taxonomy', () => {
  it('labels and tones every application status', () => {
    for (const stage of APPLICATION_STAGES) {
      expect(applicationStatusLabel(stage.status)).not.toBe(stage.status);
      expect(applicationStatusTone(stage.status)).toBeTruthy();
    }
  });

  it('falls back for an unrecognised status rather than rendering blank', () => {
    // The applications API serialises status as a plain string, so an enum added
    // server-side before the client knows about it must not blank the badge.
    expect(applicationStatusLabel('SOMETHING_NEW')).toBe('SOMETHING_NEW');
    expect(applicationStatusTone('SOMETHING_NEW')).toBe('neutral');
  });

  it('treats rejection as danger and withdrawal as neutral', () => {
    expect(applicationStatusTone('REJECTED')).toBe('danger');
    expect(applicationStatusTone('WITHDRAWN')).toBe('neutral');
  });

  it('marks every closed stage as a real stage', () => {
    const known = APPLICATION_STAGES.map((s) => s.status);
    for (const status of CLOSED_APPLICATION_STATUSES) expect(known).toContain(status);
  });

  it('buckets match scores at the 70/50 thresholds', () => {
    expect(matchTone(0.92)).toBe('success');
    expect(matchTone(0.7)).toBe('success');
    expect(matchTone(0.69)).toBe('warn');
    expect(matchTone(0.5)).toBe('warn');
    expect(matchTone(0.49)).toBe('neutral');
    expect(matchTone(0)).toBe('neutral');
  });
});
