import { PillNav } from '../pill-nav';

const LINKS = [
  { href: '/jobseeker/applications', label: 'Applications' },
  { href: '/jobseeker/matches', label: 'Matches' },
  { href: '/jobseeker/saved', label: 'Saved' },
  { href: '/jobseeker/resumes', label: 'Resumes' },
  { href: '/jobseeker/chats', label: 'Chats' },
  { href: '/jobseeker/subscriptions', label: 'Subscriptions' },
  { href: '/jobseeker/profile', label: 'Profile' },
  { href: '/jobseeker/notifications', label: 'Notifications' },
];

// Jobseeker sub-nav. Auth is already enforced by the (authenticated) layout.
export default function JobseekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <PillNav label="Jobseeker" links={LINKS} />
      {children}
    </section>
  );
}
