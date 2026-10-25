'use client';

import { ConsoleNav, type ConsoleNavLink } from '@/app/components/console/nav';
import { useNotifications } from '@/lib/query/notifications';

// Module menu for the employer console. "Post a job" is deliberately NOT here:
// a create action belongs on the control panel of the list it creates into, not
// in the section menu. Unread notifications are spliced in from the shared
// polling hook so the employer module bar shows the same live count pip as the
// jobseeker workspace.
const LINKS: Omit<ConsoleNavLink, 'count'>[] = [
  { href: '/company/jobs', label: 'Jobs', icon: 'Briefcase' },
  { href: '/company/jobseekers', label: 'Talent', icon: 'Users' },
  { href: '/company/chats', label: 'Chats', icon: 'MessagesSquare' },
  { href: '/company/notifications', label: 'Notifications', icon: 'Bell' },
  { href: '/company/settings', label: 'Settings', icon: 'Settings' },
];

export function CompanyConsoleNav() {
  const { data } = useNotifications();
  const unread = data?.filter((n) => !n.readAt).length ?? 0;

  return (
    <ConsoleNav
      module="Recruitment"
      moduleHref="/company/jobs"
      links={LINKS.map((l) => (l.href === '/company/notifications' ? { ...l, count: unread } : l))}
    />
  );
}
