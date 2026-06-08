import Link from 'next/link';
import { Container } from '@/app/components/ui/container';

const link = 'text-sm text-neutral-700 transition-colors hover:text-neutral-900';

// Jobseeker sub-nav. Auth is already enforced by the (authenticated) layout.
export default function JobseekerLayout({ children }: { children: React.ReactNode }) {
  return (
    <section>
      <nav className="border-b border-neutral-200">
        <Container className="flex flex-wrap gap-x-5 gap-y-2 py-3">
          <Link href="/jobseeker/applications" className={link}>
            Applications
          </Link>
          <Link href="/jobseeker/saved" className={link}>
            Saved
          </Link>
          <Link href="/jobseeker/resumes" className={link}>
            Resumes
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
