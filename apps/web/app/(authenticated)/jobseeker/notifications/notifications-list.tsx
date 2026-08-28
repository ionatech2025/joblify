'use client';

import Link from 'next/link';
import { ArrowRight, BellOff } from 'lucide-react';
import {
  useNotifications,
  NOTIFICATION_POLL_MS,
  useMarkNotificationRead,
  type NotificationItem,
} from '@/lib/query/notifications';
import { EmptyState } from '@/app/components/ui/empty-state';
import { buttonClasses } from '@/app/components/ui/button';

const KIND_LABEL: Record<string, string> = {
  APPLICATION_SUBMITTED: 'Application submitted',
  APPLICATION_STATUS_CHANGED: 'Application update',
  NEW_APPLICANT: 'New applicant',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  INVITATION_RECEIVED: 'Invitation',
  ACCOUNT_UPDATE: 'Account',
  SYSTEM: 'System',
  JOB_SHARED: 'Job shared with you',
  CHAT_AREA_ADDED: 'Added to a chat',
  NEW_SUBSCRIBER: 'New subscriber',
  INVITATION_RESPONDED: 'Invitation answered',
};

export function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const { data, isError } = useNotifications(NOTIFICATION_POLL_MS.list);
  const mark = useMarkNotificationRead();
  const items = data ?? initial;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<BellOff />}
        title="You're all caught up"
        description="Application updates, invitations and new messages will land here."
        action={
          <Link href="/jobs" className={`${buttonClasses()} no-underline`}>
            Browse jobs
          </Link>
        }
      />
    );
  }

  return (
    <>
      {isError && (
        <p className="mb-3 text-sm text-danger">
          Live updates are paused — showing the last known list. Refresh to try again.
        </p>
      )}
      <ul className="grid list-none grid-cols-1 gap-2 p-0">
        {items.map((n) => {
          const isRead = !!n.readAt;
          return (
            <li
              key={n.id}
              className={`flex justify-between gap-4 rounded-card border px-4 py-3 shadow-soft ${
                isRead ? 'border-border bg-surface' : 'border-border bg-brand-subtle'
              }`}
            >
              <div>
                <p className={`mb-1 text-fg ${isRead ? 'font-normal' : 'font-semibold'}`}>
                  {KIND_LABEL[n.kind] ?? n.kind}
                </p>
                <p className="m-0 text-sm text-fg-muted">{summarize(n.payload)}</p>
                {typeof n.payload.jobSlug === 'string' && (
                  <Link
                    href={`/jobs/${n.payload.jobSlug}`}
                    className="inline-flex items-center gap-1 text-sm text-brand underline"
                  >
                    View job
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                {typeof n.payload.chatAreaId === 'string' && (
                  <Link
                    href={`/jobseeker/chats/${n.payload.chatAreaId}`}
                    className="inline-flex items-center gap-1 text-sm text-brand underline"
                  >
                    Open chat
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                {typeof n.payload.invitationId === 'string' && n.kind === 'INVITATION_RECEIVED' && (
                  <Link
                    href="/jobseeker/subscriptions"
                    className="inline-flex items-center gap-1 text-sm text-brand underline"
                  >
                    View invitation
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                <p className="mt-1 mb-0 text-xs text-fg-subtle">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!isRead && (
                <button
                  onClick={() => mark.mutate(n.id)}
                  disabled={mark.isPending}
                  className="self-start text-sm text-brand underline disabled:opacity-50"
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

function summarize(payload: Record<string, unknown>): string {
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.summary === 'string') return payload.summary;
  return '';
}
