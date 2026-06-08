'use client';

import { useNotifications, useMarkNotificationRead, type NotificationItem } from '@/lib/query/notifications';

const KIND_LABEL: Record<string, string> = {
  APPLICATION_SUBMITTED: 'Application submitted',
  APPLICATION_STATUS_CHANGED: 'Application update',
  NEW_APPLICANT: 'New applicant',
  INTERVIEW_SCHEDULED: 'Interview scheduled',
  INVITATION_RECEIVED: 'Invitation',
  ACCOUNT_UPDATE: 'Account',
  SYSTEM: 'System',
};

export function NotificationsList({ initial }: { initial: NotificationItem[] }) {
  const { data } = useNotifications();
  const mark = useMarkNotificationRead();
  const items = data ?? initial;

  if (items.length === 0) {
    return <p className="text-neutral-600">No notifications yet.</p>;
  }

  return (
    <ul className="grid list-none grid-cols-1 gap-2 p-0">
      {items.map((n) => {
        const isRead = !!n.readAt;
        return (
          <li
            key={n.id}
            className={`flex justify-between gap-4 rounded-lg border border-neutral-200 px-4 py-3 ${isRead ? 'bg-white' : 'bg-indigo-50/40'}`}
          >
            <div>
              <p className={`mb-1 text-neutral-900 ${isRead ? 'font-normal' : 'font-semibold'}`}>
                {KIND_LABEL[n.kind] ?? n.kind}
              </p>
              <p className="m-0 text-sm text-neutral-600">{summarize(n.payload)}</p>
              <p className="mt-1 mb-0 text-xs text-neutral-500">{new Date(n.createdAt).toLocaleString()}</p>
            </div>
            {!isRead && (
              <button
                onClick={() => mark.mutate(n.id)}
                disabled={mark.isPending}
                className="self-start text-sm text-blue-700 hover:underline disabled:opacity-50"
              >
                Mark read
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function summarize(payload: Record<string, unknown>): string {
  if (typeof payload.message === 'string') return payload.message;
  if (typeof payload.summary === 'string') return payload.summary;
  return '';
}
