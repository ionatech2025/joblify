'use client';

import Link from 'next/link';
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

const link: React.CSSProperties = { color: '#111', textDecoration: 'none', fontSize: '0.95rem' };

export function Header() {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        padding: '0.75rem 2rem',
        borderBottom: '1px solid #eee',
        position: 'sticky',
        top: 0,
        background: '#fff',
        zIndex: 50,
      }}
    >
      <Link href="/" style={{ fontWeight: 800, fontSize: '1.15rem', color: '#111', textDecoration: 'none' }}>
        Joblify
      </Link>
      <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <Link href="/jobs" style={link}>
          Find jobs
        </Link>
        <Link href="/companies" style={link}>
          Companies
        </Link>
        <Link href="/employer-setup" style={link}>
          Post a job
        </Link>
        <SignedOut>
          <Link href="/sign-in" style={link}>
            Sign in
          </Link>
          <Link
            href="/sign-up"
            style={{ ...link, background: '#111', color: '#fff', padding: '0.45rem 0.9rem', borderRadius: 6, fontWeight: 600 }}
          >
            Sign up
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard" style={link}>
            Dashboard
          </Link>
          <UserButton />
        </SignedIn>
      </nav>
    </header>
  );
}
