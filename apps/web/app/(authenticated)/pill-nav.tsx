'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@/app/components/ui/container';

export type PillNavLink = { href: string; label: string };

// Dashboard sub-nav as a pill strip, shared by the jobseeker and company
// shells. The active item — the longest href matching the current pathname,
// so /company/jobs/new lights "Post a job" rather than "Jobs" — renders as an
// ink pill with aria-current="page"; the rest are ghost pills. Client
// component purely for usePathname; the parent layouts keep the auth checks
// and own their link sets.
export function PillNav({ label, links }: { label: string; links: PillNavLink[] }) {
  const pathname = usePathname();
  const active = links.reduce<PillNavLink | null>((best, l) => {
    const matches = pathname === l.href || pathname.startsWith(`${l.href}/`);
    if (!matches) return best;
    return best && best.href.length > l.href.length ? best : l;
  }, null);

  return (
    <nav aria-label={label} className="border-b border-border bg-surface/70 backdrop-blur">
      <Container className="flex flex-wrap gap-x-1.5 gap-y-1.5 py-2.5">
        {links.map((l) => {
          const isActive = active?.href === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium no-underline transition-colors ${
                isActive
                  ? 'bg-ink text-ink-fg hover:bg-ink-hover'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </Container>
    </nav>
  );
}
