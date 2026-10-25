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
import { TimeStamp } from '@/app/components/ui/timestamp';

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

export function NotificationsList({
  initial,
  role = 'JOB_SEEKER',
}: {
  initial: NotificationItem[];
  role?: 'JOB_SEEKER' | 'COMPANY';
}) {
  const { data, isError } = useNotifications(NOTIFICATION_POLL_MS.list);
  const mark = useMarkNotificationRead();
  const items = data ?? initial;

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

  return (
    <>
      {isError && (
        <p className="mb-3 text-sm text-danger">
          Live updates are paused — showing the last known list. Refresh to try again.
        </p>
      )}
      <ul className="border-border bg-surface rounded-card divide-border m-0 list-none divide-y overflow-hidden border p-0">
        {items.map((n) => {
          const isRead = !!n.readAt;
          return (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 px-4 py-3 transition-colors ${
                isRead ? 'bg-surface' : 'bg-brand-subtle/60'
              }`}
            >
              <div className="min-w-0">
                <p
                  className={`text-fg mb-0.5 text-[13px] ${isRead ? 'font-medium' : 'font-semibold'}`}
                >
                  {!isRead && (
                    <span
                      aria-hidden
                      className="bg-brand mr-1.5 inline-block size-2 rounded-full align-middle"
                    />
                  )}
                  {KIND_LABEL[n.kind] ?? n.kind}
                </p>
                <p className="text-fg-muted m-0 text-[13px]">{summarize(n.payload)}</p>
                {typeof n.payload.jobSlug === 'string' && (
                  <Link
                    href={`/jobs/${n.payload.jobSlug}`}
                    className="text-brand mt-1 inline-flex min-h-6 items-center gap-1 text-[13px] underline"
                  >
                    View job
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                {role === 'COMPANY' && typeof n.payload.jobId === 'string' && (
                  <Link
                    href={`/company/applicants/${n.payload.jobId}`}
                    className="text-brand mt-1 inline-flex min-h-6 items-center gap-1 text-[13px] underline"
                  >
                    Review applicants
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                {role === 'COMPANY' &&
                  (n.kind === 'NEW_SUBSCRIBER' || n.kind === 'INVITATION_RESPONDED') && (
                    <Link
                      href="/company/jobseekers?filter=subscribed"
                      className="text-brand mt-1 inline-flex min-h-6 items-center gap-1 text-[13px] underline"
                    >
                      View subscribers
                      <ArrowRight aria-hidden className="size-3.5" />
                    </Link>
                  )}
                {typeof n.payload.chatAreaId === 'string' && (
                  <Link
                    href={
                      role === 'COMPANY'
                        ? `/company/chats/${n.payload.chatAreaId}`
                        : `/jobseeker/chats/${n.payload.chatAreaId}`
                    }
                    className="text-brand mt-1 inline-flex min-h-6 items-center gap-1 text-[13px] underline"
                  >
                    Open chat
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                {typeof n.payload.invitationId === 'string' && n.kind === 'INVITATION_RECEIVED' && (
                  <Link
                    href="/jobseeker/subscriptions"
                    className="text-brand mt-1 inline-flex min-h-6 items-center gap-1 text-[13px] underline"
                  >
                    View invitation
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
                <p className="text-fg-subtle mt-1 mb-0 text-[12px]">
                  <TimeStamp value={n.createdAt} mode="datetime" />
                </p>
              </div>
              {!isRead && (
                <button
                  type="button"
                  onClick={() => mark.mutate(n.id)}
                  disabled={mark.isPending}
                  className="text-brand inline-flex min-h-7 shrink-0 items-center self-start px-2 text-[13px] font-medium underline disabled:opacity-50"
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
