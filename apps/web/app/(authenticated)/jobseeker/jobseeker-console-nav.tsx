'use client';

import { ConsoleNav, type ConsoleNavLink } from '@/app/components/console/nav';
import { useNotifications } from '@/lib/query/notifications';

// The link set lives here rather than in layout.tsx because the unread count has
// to be spliced into it, and useNotifications() is a client-side polling hook.
const LINKS: Omit<ConsoleNavLink, 'count'>[] = [
  { href: '/jobseeker/applications', label: 'Applications', icon: 'BriefcaseBusiness' },
  { href: '/jobseeker/matches', label: 'Matches', icon: 'Sparkles' },
  { href: '/jobseeker/saved', label: 'Saved', icon: 'Bookmark' },
  { href: '/jobseeker/resumes', label: 'Resumes', icon: 'FileText' },
  { href: '/jobseeker/chats', label: 'Chats', icon: 'MessagesSquare' },
  { href: '/jobseeker/subscriptions', label: 'Following', icon: 'Building2' },
  { href: '/jobseeker/notifications', label: 'Notifications', icon: 'Bell' },
  { href: '/jobseeker/profile', label: 'Profile', icon: 'UserRound' },
];

export function JobseekerConsoleNav() {
  const { data } = useNotifications();
  const unread = data?.filter((n) => !n.readAt).length ?? 0;

  return (
    <ConsoleNav
      module="My workspace"
      moduleHref="/jobseeker/applications"
      links={LINKS.map((l) =>
        l.href === '/jobseeker/notifications' ? { ...l, count: unread } : l,
      )}
    />
  );
}
