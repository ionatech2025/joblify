import Link from 'next/link';
import { Container } from './ui/container';

const link = 'text-band-fg-muted no-underline transition-colors hover:text-band-fg';

// Dark ink band — the closing register of every page. Light text on
// near-black, generous padding, wordmark left / nav right.
export function Footer() {
  return (
    <footer className="mt-16 bg-band text-band-fg-muted">
      <Container className="flex flex-col gap-8 py-12 text-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="display m-0 text-xl text-band-fg">Joblify</p>
            <p className="m-0 mt-2 max-w-xs text-band-fg-muted">
              Search jobs by skill, location, and salary. Apply in one click with an AI-parsed
              résumé.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Footer">
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
        </div>
        <p className="m-0 border-t border-band-fg/10 pt-6 text-band-fg-muted">© Joblify</p>
      </Container>
    </footer>
  );
}
