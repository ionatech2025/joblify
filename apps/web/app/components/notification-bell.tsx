'use client';

import Link from 'next/link';
import { Bell } from 'lucide-react';
import { NOTIFICATIONS_PAGE_CAP } from '@/lib/query/client';
import { NOTIFICATION_POLL_MS, useUnreadNotificationCount } from '@/lib/query/notifications';

/**
 * Header bell with an unread-count badge. It is rendered twice (the desktop
 * and mobile header islands are both mounted, one CSS-hidden), so only the
 * one passed `poll` runs the badge interval.
 *
 * The number lives in the link's name, not a live region: a background poll
 * must not interrupt a screen reader, and the name is current whenever focus
 * lands here. The count comes from the newest NOTIFICATIONS_PAGE_CAP rows, so
 * at the cap it can only say "or more".
 */
export function NotificationBell({ poll = false }: { poll?: boolean }) {
  const { data, isError } = useUnreadNotificationCount(poll ? NOTIFICATION_POLL_MS.badge : false);
  const unread = isError ? 0 : (data ?? 0);
  const label =
    unread === 0
      ? 'Notifications'
      : unread >= NOTIFICATIONS_PAGE_CAP
        ? `Notifications, ${NOTIFICATIONS_PAGE_CAP} or more unread`
        : `Notifications, ${unread} unread`;

  return (
    <Link
      href="/dashboard/notifications"
      prefetch={false}
      aria-label={label}
      title={label}
      className="text-fg-muted hover:bg-surface-sunken hover:text-fg border-border focus-visible:ring-brand focus-visible:ring-offset-canvas relative grid size-[36px] shrink-0 place-items-center rounded-full border no-underline transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <Bell aria-hidden className="size-4" />
      {unread > 0 && (
        <span
          aria-hidden
          className="bg-danger text-fg-inverse ring-canvas absolute -top-[4px] -right-[4px] grid h-[18px] min-w-[18px] place-items-center rounded-pill px-[4px] text-[11px] leading-none font-bold ring-2"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  );
}
