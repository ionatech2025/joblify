'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Container } from './ui/container';

const navLink = 'text-neutral-700 transition-colors hover:text-neutral-900';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-neutral-900">
          Joblify
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm">
          <Link href="/jobs" className={navLink}>
            Find jobs
          </Link>
          <Link href="/companies" className={`hidden sm:inline ${navLink}`}>
            Companies
          </Link>
          <Link href="/employer-setup" className={navLink}>
            Post a job
          </Link>
          <SignedOut>
            <Link href="/sign-in" className={navLink}>
              Sign in
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-semibold text-white transition-colors hover:bg-neutral-700"
            >
              Sign up
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className={navLink}>
              Dashboard
            </Link>
            <UserButton />
          </SignedIn>
        </nav>
      </Container>
    </header>
  );
}
