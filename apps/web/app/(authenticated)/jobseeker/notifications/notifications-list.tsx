'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { BellOff, CheckCheck } from 'lucide-react';
import {
  useNotifications,
  NOTIFICATION_POLL_MS,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  unreadCount,
  type NotificationItem,
} from '@/lib/query/notifications';
import {
  NOTIFICATION_KIND,
  notificationHref,
  type NotificationAudience,
} from '@/lib/ui/notifications';
import { cn } from '@/lib/cn';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';
import { TimeStamp } from '@/app/components/ui/timestamp';
import { moveFocusFromRowAction } from '../move-focus';

export function NotificationsList({
  initial,
  role = 'JOB_SEEKER',
}: {
  initial: NotificationItem[];
  role?: NotificationAudience;
}) {
  const { data, isError } = useNotifications(NOTIFICATION_POLL_MS.list);
  const mark = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const [onlyUnread, setOnlyUnread] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const items = data ?? initial;
  const unread = unreadCount(items);
  const shown = onlyUnread ? items.filter((n) => !n.readAt) : items;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellOff />}
        title="You're all caught up"
        description={
          role === 'COMPANY'
            ? 'New applicants, subscriber activity, and account updates will land here.'
            : 'Application updates, invitations and new messages will land here.'
        }
        action={
          <Link
            href={role === 'COMPANY' ? '/company/jobs' : '/jobs'}
            className={`${buttonClasses()} no-underline`}
          >
            {role === 'COMPANY' ? 'View job posts' : 'Browse jobs'}
          </Link>
        }
      />
    );
  }

  // Opening a row is acting on it, so it counts as read. Navigation goes ahead
  // either way; the mutation outlives this page.
  const markOpened = (n: NotificationItem) => {
    if (!n.readAt) mark.mutate(n.id);
  };

  return (
    <>
      {isError && (
        <p className="mb-3 text-sm text-danger">
          Live updates are paused — showing the last known list. Refresh to try again.
        </p>
      )}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Show" className="flex items-center gap-1.5">
          <FilterPill pressed={!onlyUnread} onClick={() => setOnlyUnread(false)}>
            All
          </FilterPill>
          <FilterPill pressed={onlyUnread} onClick={() => setOnlyUnread(true)}>
            Unread{' '}
            {unread > 0 && (
              <span className="bg-brand-subtle text-brand-subtle-fg rounded-pill px-1 text-[11px] font-semibold">
                {unread}
              </span>
            )}
          </FilterPill>
        </div>
        {unread > 0 && (
          <button
            type="button"
            onClick={() => {
              // This button is about to disappear with the last unread row.
              listRef.current?.focus();
              markAll.mutate(items[0]!.createdAt);
            }}
            className="text-brand inline-flex min-h-7 items-center gap-1 px-1 text-[13px] font-medium underline"
          >
            <CheckCheck aria-hidden className="size-3.5" />
            Mark all as read
          </button>
        )}
      </div>
      <ul
        ref={listRef}
        tabIndex={-1}
        aria-label="Notifications"
        className="border-border bg-surface rounded-card divide-border m-0 list-none divide-y overflow-hidden border p-0"
      >
        {shown.length === 0 && (
          <li className="px-4 py-6 text-center text-[13px]">
            <p className="text-fg m-0 font-medium">No unread notifications</p>
            <button
              type="button"
              onClick={() => {
                listRef.current?.focus();
                setOnlyUnread(false);
              }}
              className="text-brand mt-1 inline-flex min-h-7 items-center px-2 font-medium underline"
            >
              Show all
            </button>
          </li>
        )}
        {shown.map((n) => {
          const isRead = !!n.readAt;
          const { label, icon: Icon } = NOTIFICATION_KIND[n.kind];
          const href = notificationHref(n, role);
          const { jobTitle, companyName } = n.payload;
          const detailId = `notification-${n.id}-detail`;
          const title = (
            <>
              {!isRead && (
                <>
                  <span
                    aria-hidden
                    className="bg-brand mr-1.5 inline-block size-2 rounded-full align-middle"
                  />
                  <span className="sr-only">Unread: </span>
                </>
              )}
              {label}
            </>
          );
          return (
            <li
              key={n.id}
              className={cn(
                'group relative flex items-start gap-3 px-4 py-3 transition-colors',
                isRead ? 'bg-surface' : 'bg-brand-subtle/60',
              )}
            >
              <span
                aria-hidden
                className="bg-surface-sunken text-fg-muted grid size-8 shrink-0 place-items-center rounded-full"
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-fg mb-0.5 text-[13px]',
                    isRead ? 'font-medium' : 'font-semibold',
                  )}
                >
                  {href ? (
                    // The ::after box stretches this link over the whole row.
                    <Link
                      href={href}
                      aria-describedby={detailId}
                      onClick={() => markOpened(n)}
                      onAuxClick={(e) => {
                        if (e.button === 1) markOpened(n);
                      }}
                      className="text-fg focus-visible:after:ring-brand no-underline group-hover:underline after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset"
                    >
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </p>
                <div id={detailId}>
                  {typeof jobTitle === 'string' && typeof companyName === 'string' && (
                    <p className="text-fg m-0 text-[13px]">
                      {jobTitle} at {companyName}
                    </p>
                  )}
                  <p className="text-fg-muted m-0 text-[13px]">{summarize(n.payload)}</p>
                </div>
                <p className="text-fg-subtle mt-1 mb-0 text-[12px]">
                  <TimeStamp value={n.createdAt} mode="datetime" />
                </p>
              </div>
              {!isRead && (
                <button
                  type="button"
                  data-row-action="mark-read"
                  onClick={(e) => {
                    if (mark.isPending) return;
                    moveFocusFromRowAction(e.currentTarget, listRef.current);
                    mark.mutate(n.id);
                  }}
                  aria-disabled={mark.isPending || undefined}
                  className="text-brand relative z-10 inline-flex min-h-7 shrink-0 items-center self-start px-2 text-[13px] font-medium underline aria-disabled:opacity-50"
                >
                  Mark read
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function FilterPill({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        'rounded-pill inline-flex min-h-7 items-center gap-1.5 border px-3 text-[13px] font-medium transition-colors',
        pressed
          ? 'border-ink bg-ink text-ink-fg'
          : 'border-border text-fg-muted hover:bg-surface-sunken hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

function summarize(payload: Record<string, unknown>): string {
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.summary === 'string') return payload.summary;
  return '';
}
