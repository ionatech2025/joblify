'use client';

import { PillNav, type PillNavLink } from '../pill-nav';
import { useNotifications } from '@/lib/query/notifications';

// Wraps the shared PillNav with a live unread-notifications count. Split out
// from layout.tsx (a plain server component) because useNotifications() is a
// client-side polling hook — this is the one thing in the jobseeker shell
// that needs it, so the fetch stays scoped here rather than in PillNav
// itself, which company's shell also uses and has no notifications surface.
export function JobseekerPillNav({ links }: { links: PillNavLink[] }) {
  const { data } = useNotifications();
  const unread = data?.filter((n) => !n.readAt).length ?? 0;

  return (
    <PillNav label="Jobseeker" links={links} badgeCounts={{ '/jobseeker/notifications': unread }} />
  );
}
