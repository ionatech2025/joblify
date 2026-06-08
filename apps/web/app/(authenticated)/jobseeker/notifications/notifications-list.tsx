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
    return <p style={{ color: '#666' }}>No notifications yet.</p>;
  }

  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem' }}>
      {items.map((n) => {
        const isRead = !!n.readAt;
        return (
          <li
            key={n.id}
            style={{
              padding: '0.75rem 1rem',
              border: '1px solid #eee',
              borderRadius: 8,
              background: isRead ? '#fff' : '#fafbff',
              display: 'flex',
              justifyContent: 'space-between',
              gap: '1rem',
            }}
          >
            <div>
              <p style={{ margin: '0 0 0.25rem', fontWeight: isRead ? 400 : 600 }}>
                {KIND_LABEL[n.kind] ?? n.kind}
              </p>
              <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
                {summarize(n.payload)}
              </p>
              <p style={{ margin: '0.25rem 0 0', color: '#888', fontSize: '0.8rem' }}>
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!isRead && (
              <button
                onClick={() => mark.mutate(n.id)}
                disabled={mark.isPending}
                style={{
                  alignSelf: 'flex-start',
                  border: 0,
                  background: 'transparent',
                  color: '#1856a8',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                }}
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
