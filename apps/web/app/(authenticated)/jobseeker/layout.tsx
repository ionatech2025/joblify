import Link from 'next/link';
import { Container } from '@/app/components/ui/container';

const link = 'text-sm text-neutral-700 transition-colors hover:text-neutral-900';

// Jobseeker sub-nav. Auth is already enforced by the (authenticated) layout.
export default function JobseekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <nav className="border-b border-indigo-100 bg-white/70 backdrop-blur">
        <Container className="flex flex-wrap gap-x-5 gap-y-2 py-3">
          <Link href="/jobseeker/applications" className={link}>
            Applications
          </Link>
          <Link href="/jobseeker/matches" className={link}>
            Matches
          </Link>
          <Link href="/jobseeker/saved" className={link}>
            Saved
          </Link>
          <Link href="/jobseeker/resumes" className={link}>
            Resumes
          </Link>
          <Link href="/jobseeker/chats" className={link}>
            Chats
          </Link>
          <Link href="/jobseeker/subscriptions" className={link}>
            Subscriptions
          </Link>
          <Link href="/jobseeker/profile" className={link}>
            Profile
          </Link>
          <Link href="/jobseeker/notifications" className={link}>
            Notifications
          </Link>
        </Container>
      </nav>
      {children}
    </section>
  );
}
