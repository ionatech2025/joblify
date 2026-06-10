import Link from 'next/link';
import { Container } from './ui/container';

const link = 'text-neutral-600 transition-colors hover:text-neutral-900';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200">
      <Container className="flex flex-col gap-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 text-neutral-500">© Joblify</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/jobs" className={link}>
            Jobs
          </Link>
          <Link href="/companies" className={link}>
            Companies
          </Link>
          <Link href="/about" className={link}>
            About
          </Link>
          <Link href="/legal/privacy" className={link}>
            Privacy
          </Link>
          <Link href="/legal/terms" className={link}>
            Terms
          </Link>
          <Link href="/accessibility" className={link}>
            Accessibility
          </Link>
        </nav>
      </Container>
    </footer>
  );
}
