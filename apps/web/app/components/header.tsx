'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Menu, Search, X } from 'lucide-react';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { useUiStore } from '@/lib/stores/ui';
import { Container } from './ui/container';
import { ThemeToggle } from './ui/theme-toggle';
import { Kbd } from './ui/kbd';

const navLink = 'text-fg-muted transition-colors hover:text-fg';

const NAV = [
  { href: '/jobs', label: 'Find jobs' },
  { href: '/companies', label: 'Companies' },
  { href: '/employer-setup', label: 'Post a job' },
];

// `auth` is the server-rendered auth island (<HeaderAuth> in the root layout):
// the only session-dependent slice of the header, streamed inside its own
// Suspense boundary so the rest of the header stays in the static shell. The
// mobile controls/menu keep Clerk's client control components — they resolve
// after hydration, behind a user interaction, exactly as before.
export function Header({ auth }: { auth?: ReactNode }) {
  // Mobile-menu state lives in the shared UI store rather than local useState
  // so the command palette and future surfaces can close it.
  const open = useUiStore((s) => s.isMobileMenuOpen);
  const setOpen = useUiStore((s) => s.setMobileMenuOpen);
  const setPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen);
  const close = () => setOpen(false);

  // No aria-current on these links, deliberately. Marking the active one needs
  // usePathname(), which is uncached data — reading it here, at root-layout
  // scope outside any Suspense boundary, fails the build with "Uncached data
  // was accessed outside of <Suspense>" on every route. It is the same trap
  // that forced the custom clerk-provider.tsx wrapper (#38). The dashboard
  // PillNavs can do it because they sit inside a Suspense-gated subtree.

  return (
    <header className="glass border-border sticky top-0 z-50 border-b">
      <Container className="flex items-center justify-between gap-4 py-3">
        <Link
          href="/"
          onClick={close}
          className="text-fg flex items-center gap-2 text-lg font-extrabold tracking-tight no-underline"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- small fixed-size brand mark */}
          <img src="/logo.png" alt="" width={28} height={28} className="size-7 rounded-md" />
          Joblify
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm sm:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={navLink}>
              {item.label}
            </Link>
          ))}
          {/* Palette trigger — the shortcut is bound globally in
              command-palette.tsx; this is the discoverable/pointer entry. */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="border-border bg-surface/60 text-fg-subtle hover:text-fg hover:border-border-strong focus-visible:ring-brand hidden items-center gap-2 rounded-full border py-1.5 pr-1.5 pl-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none lg:inline-flex"
          >
            <Search aria-hidden className="size-3.5" />
            Search
            <Kbd>⌘K</Kbd>
          </button>
          <ThemeToggle />
          {auth}
        </nav>

        {/* Mobile controls */}
        <div className="flex items-center gap-2 sm:hidden">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Search"
            className="text-fg-muted hover:text-fg border-border grid size-9 place-items-center rounded-full border transition-colors"
          >
            <Search aria-hidden className="size-4" />
          </button>
          <ThemeToggle />
          <SignedIn>
            <UserButton />
          </SignedIn>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="border-border text-fg-muted grid size-9 place-items-center rounded-full border"
          >
            {open ? <X aria-hidden className="size-4" /> : <Menu aria-hidden className="size-4" />}
          </button>
        </div>
      </Container>

      {/* Mobile menu panel */}
      {open && (
        <nav className="glass border-border border-t sm:hidden">
          <Container className="flex flex-col py-2 text-sm">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className="text-fg-muted py-2 no-underline"
              >
                {item.label}
              </Link>
            ))}
            <SignedOut>
              <Link href="/sign-in" onClick={close} className="text-fg-muted py-2 no-underline">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                onClick={close}
                className="text-fg py-2 font-semibold no-underline"
              >
                Sign up
              </Link>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard" onClick={close} className="text-fg-muted py-2 no-underline">
                Dashboard
              </Link>
            </SignedIn>
          </Container>
        </nav>
      )}
    </header>
  );
}
