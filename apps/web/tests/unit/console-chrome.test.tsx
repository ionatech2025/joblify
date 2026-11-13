// @vitest-environment jsdom

import type { ComponentType } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsoleNav } from '@/app/components/console/nav';
import { FilterMenu } from '@/app/components/console/filter-menu';
import { ListView } from '@/app/components/console/list-view';
import { DirtyBar } from '@/app/components/console/dirty-bar';
import RootError from '@/app/error';
import CompanyError from '@/app/company/error';
import AdminError from '@/app/admin/error';
import AuthenticatedError from '@/app/(authenticated)/error';
import JobseekerError from '@/app/(authenticated)/jobseeker/error';

const reportClientError = vi.hoisted(() => vi.fn());
vi.mock('@/lib/observability/sentry-client', () => ({ reportClientError }));
vi.mock('next/navigation', () => ({ usePathname: () => '/company/jobs' }));

let lastResizeCallback: (() => void) | undefined;
vi.stubGlobal(
  'ResizeObserver',
  class {
    constructor(callback: () => void) {
      lastResizeCallback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  },
);

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  reportClientError.mockReset();
});

describe('ConsoleNav', () => {
  it('names the exact unread count for screen readers, not the capped pip', () => {
    render(
      <ConsoleNav
        module="Recruitment"
        links={[
          { href: '/company/jobs', label: 'Jobs' },
          { href: '/company/notifications', label: 'Notifications', count: 12 },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: /^Notifications\s?, 12 unread$/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Jobs' }).getAttribute('aria-current')).toBe('page');
  });
});

describe('FilterMenu', () => {
  it('exposes the applied filter as a checked menu item', async () => {
    const user = userEvent.setup();
    render(
      <FilterMenu
        label="Status"
        activeCount={1}
        groups={[
          {
            items: [
              { label: 'Open', href: '/company/jobs?status=OPEN', active: true },
              { label: 'Closed', href: '/company/jobs?status=CLOSED' },
            ],
          },
        ]}
      />,
    );
    screen.getByRole('button', { name: /Status/ }).focus();
    await user.keyboard('{Enter}');
    const open = screen.getByRole('menuitemcheckbox', { name: 'Open' });
    const closed = screen.getByRole('menuitemcheckbox', { name: 'Closed' });
    expect(open.getAttribute('aria-checked')).toBe('true');
    expect(closed.getAttribute('aria-checked')).toBe('false');
    expect(open.getAttribute('href')).toBe('/company/jobs?status=OPEN');
  });
});

describe('ListView sort headers', () => {
  type Row = { id: string; title: string; posted: string };
  const columns = [
    { key: 'title', header: 'Title', sort: 'title', cell: (r: Row) => r.title },
    { key: 'posted', header: 'Posted', sort: 'posted', cell: (r: Row) => r.posted },
  ];

  it('announces the sorted column and its direction on the header control', () => {
    render(
      <ListView
        caption="Jobs"
        columns={columns}
        rows={[{ id: '1', title: 'Engineer', posted: 'Today' }]}
        rowKey={(r) => r.id}
        sort={{ key: 'posted', dir: 'desc' }}
        hrefForSort={(key, dir) => `/company/jobs?sort=${key}&dir=${dir}`}
      />,
    );
    const sorted = screen.getByRole('link', { name: /^Posted\s?, sorted descending$/ });
    expect(sorted.getAttribute('href')).toBe('/company/jobs?sort=posted&dir=asc');
    expect(sorted.closest('th')?.getAttribute('aria-sort')).toBe('descending');
    expect(
      screen.getByRole('link', { name: 'Title' }).closest('th')?.getAttribute('aria-sort'),
    ).toBe('none');
  });
});

describe('DirtyBar published height', () => {
  it('tracks its own height while mounted and withdraws it on unmount', () => {
    let height = 52;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      () => ({ height }) as DOMRect,
    );
    const style = document.documentElement.style;

    const { unmount } = render(<DirtyBar dirty onDiscard={() => {}} />);
    expect(style.getPropertyValue('--dirty-bar-h')).toBe('52px');

    height = 77.4;
    lastResizeCallback?.();
    expect(style.getPropertyValue('--dirty-bar-h')).toBe('78px');

    unmount();
    expect(style.getPropertyValue('--dirty-bar-h')).toBe('');
  });
});

describe('error boundaries', () => {
  const boundaries: [string, ComponentType<{ error: Error; retry: () => void }>][] = [
    ['root', RootError],
    ['company', CompanyError],
    ['admin', AdminError],
    ['authenticated', AuthenticatedError],
    ['jobseeker', JobseekerError],
  ];

  it.each(boundaries)(
    '%s: Try again refetches through retry and reports once',
    async (_, Boundary) => {
      const user = userEvent.setup();
      const retry = vi.fn();
      const error = new Error('boom');
      render(<Boundary error={error} retry={retry} />);

      expect(screen.getByRole('heading', { level: 1, name: 'Something went wrong' })).toBeTruthy();
      await user.click(screen.getByRole('button', { name: 'Try again' }));
      expect(retry).toHaveBeenCalledOnce();
      expect(reportClientError).toHaveBeenCalledExactlyOnceWith(error);
    },
  );

  it.each(boundaries.slice(1))(
    '%s: offers a way back that leaves the failed page',
    (_, Boundary) => {
      render(<Boundary error={new Error('boom')} retry={() => {}} />);
      expect(screen.getByRole('link', { name: 'Go to dashboard' }).getAttribute('href')).toBe(
        '/dashboard',
      );
    },
  );
});
