'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { Container } from './ui/container';

const navLink = 'text-neutral-700 transition-colors hover:text-neutral-900';

export function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link href="/" onClick={close} className="text-lg font-extrabold tracking-tight text-neutral-900 no-underline">
          Joblify
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          <Link href="/jobs" className={navLink}>
            Find jobs
          </Link>
          <Link href="/companies" className={navLink}>
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
              className="rounded-lg bg-neutral-900 px-3 py-1.5 font-semibold text-white no-underline transition-colors hover:bg-neutral-700"
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

        {/* Mobile controls */}
        <div className="flex items-center gap-3 sm:hidden">
          <SignedIn>
            <UserButton />
          </SignedIn>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="inline-flex size-9 items-center justify-center rounded-md border border-neutral-300 text-neutral-700"
          >
            <span aria-hidden="true">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </Container>

      {/* Mobile menu panel */}
      {open && (
        <nav className="border-t border-neutral-200 bg-white sm:hidden">
          <Container className="flex flex-col py-2 text-sm">
            <Link href="/jobs" onClick={close} className="py-2 text-neutral-700 no-underline">
              Find jobs
            </Link>
            <Link href="/companies" onClick={close} className="py-2 text-neutral-700 no-underline">
              Companies
            </Link>
            <Link href="/employer-setup" onClick={close} className="py-2 text-neutral-700 no-underline">
              Post a job
            </Link>
            <SignedOut>
              <Link href="/sign-in" onClick={close} className="py-2 text-neutral-700 no-underline">
                Sign in
              </Link>
              <Link href="/sign-up" onClick={close} className="py-2 font-semibold text-neutral-900 no-underline">
                Sign up
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" onClick={close} className="py-2 text-neutral-700 no-underline">
                Dashboard
              </Link>
            </SignedIn>
          </Container>
        </nav>
      )}
    </header>
  );
}
