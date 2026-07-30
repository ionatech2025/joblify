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
//
// badgeCounts is presentational only — keyed by href, purely optional — so
// this component stays reusable without knowing anything about notifications
// specifically. A caller that wants a live count (e.g. jobseeker-pill-nav.tsx)
// fetches it and passes it in.
export function PillNav({
  label,
  links,
  badgeCounts,
}: {
  label: string;
  links: PillNavLink[];
  badgeCounts?: Record<string, number>;
}) {
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
          const count = badgeCounts?.[l.href] ?? 0;
          return (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium no-underline transition-colors ${
                isActive
                  ? 'bg-ink text-ink-fg hover:bg-ink-hover'
                  : 'text-fg-muted hover:bg-surface-sunken hover:text-fg'
              }`}
            >
              {l.label}
              {count > 0 && (
                <span
                  className={`inline-flex min-w-[1.125rem] items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    // On the active (ink) pill, bg-ink would be invisible against
                    // its own background — invert instead of just reusing it.
                    isActive ? 'bg-surface text-ink' : 'bg-ink text-ink-fg'
                  }`}
                  aria-label={`${count} unread`}
                >
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>
          );
        })}
      </Container>
    </nav>
  );
}
