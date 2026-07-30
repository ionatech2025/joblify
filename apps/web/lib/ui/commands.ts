import type { Theme } from '@/lib/stores/ui';

/**
 * Command-palette catalogue and matcher.
 *
 * Data + pure filter live here rather than in the client component so the
 * matching rules are unit-testable without loading React, lucide or
 * next/navigation into a node-env test. `icon` is a lucide component name
 * resolved by the component — keeping it a string keeps this module free of
 * any UI dependency.
 */

export type CommandSection = 'Go to' | 'Jobseeker' | 'Company' | 'Theme' | 'Help';

export type Command = {
  id: string;
  label: string;
  section: CommandSection;
  /** Key into the palette's icon map (app/components/command-palette.tsx). */
  icon: string;
  /** Extra match terms that aren't in the visible label. */
  keywords?: string;
  href?: string;
  theme?: Theme;
};

// The catalogue intentionally spans both roles: the route guards already
// redirect anyone who picks a surface they can't reach, and filtering by role
// would need a session fetch on every page just to build a menu.
export const COMMANDS: Command[] = [
  {
    id: 'jobs',
    label: 'Find jobs',
    section: 'Go to',
    icon: 'Search',
    href: '/jobs',
    keywords: 'search roles vacancies openings',
  },
  {
    id: 'companies',
    label: 'Browse companies',
    section: 'Go to',
    icon: 'Building2',
    href: '/companies',
    keywords: 'employers organisations',
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    section: 'Go to',
    icon: 'Gauge',
    href: '/dashboard',
    keywords: 'home overview',
  },

  {
    id: 'applications',
    label: 'My applications',
    section: 'Jobseeker',
    icon: 'Briefcase',
    href: '/jobseeker/applications',
    keywords: 'applied status tracker',
  },
  {
    id: 'matches',
    label: 'My matches',
    section: 'Jobseeker',
    icon: 'Sparkles',
    href: '/jobseeker/matches',
    keywords: 'recommended suggested',
  },
  {
    id: 'saved',
    label: 'Saved jobs & searches',
    section: 'Jobseeker',
    icon: 'Bookmark',
    href: '/jobseeker/saved',
    keywords: 'bookmarks alerts',
  },
  {
    id: 'resumes',
    label: 'Resumes',
    section: 'Jobseeker',
    icon: 'FileText',
    href: '/jobseeker/resumes',
    keywords: 'cv upload builder',
  },
  {
    id: 'seeker-chats',
    label: 'Messages',
    section: 'Jobseeker',
    icon: 'MessageSquare',
    href: '/jobseeker/chats',
    keywords: 'chat conversations inbox',
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions & invitations',
    section: 'Jobseeker',
    icon: 'Bell',
    href: '/jobseeker/subscriptions',
    keywords: 'following invites',
  },
  {
    id: 'profile',
    label: 'My profile',
    section: 'Jobseeker',
    icon: 'UserRound',
    href: '/jobseeker/profile',
    keywords: 'bio skills experience',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    section: 'Jobseeker',
    icon: 'Bell',
    href: '/jobseeker/notifications',
    keywords: 'alerts updates',
  },

  {
    id: 'post-job',
    label: 'Post a job',
    section: 'Company',
    icon: 'SendHorizontal',
    href: '/company/jobs/new',
    keywords: 'create new vacancy hire',
  },
  {
    id: 'company-jobs',
    label: 'Manage job posts',
    section: 'Company',
    icon: 'Briefcase',
    href: '/company/jobs',
    keywords: 'listings drafts applicants',
  },
  {
    id: 'directory',
    label: 'Job seeker directory',
    section: 'Company',
    icon: 'Users',
    href: '/company/jobseekers',
    keywords: 'candidates talent search',
  },
  {
    id: 'company-chats',
    label: 'Company messages',
    section: 'Company',
    icon: 'MessageSquare',
    href: '/company/chats',
    keywords: 'chat conversations',
  },
  {
    id: 'company-settings',
    label: 'Company settings',
    section: 'Company',
    icon: 'Settings',
    href: '/company/settings',
    keywords: 'profile logo verification',
  },

  {
    id: 'theme-light',
    label: 'Switch to light theme',
    section: 'Theme',
    icon: 'Sun',
    theme: 'light',
    keywords: 'appearance bright day',
  },
  {
    id: 'theme-dark',
    label: 'Switch to dark theme',
    section: 'Theme',
    icon: 'Moon',
    theme: 'dark',
    keywords: 'appearance night',
  },
  {
    id: 'theme-system',
    label: 'Match system theme',
    section: 'Theme',
    icon: 'Monitor',
    theme: 'system',
    keywords: 'appearance auto os',
  },

  { id: 'about', label: 'About Joblify', section: 'Help', icon: 'Info', href: '/about' },
  {
    id: 'accessibility',
    label: 'Accessibility statement',
    section: 'Help',
    icon: 'ShieldCheck',
    href: '/accessibility',
    keywords: 'a11y wcag',
  },
];

/** Case-insensitive substring match over label + section + keywords. */
export function filterCommands(commands: Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) =>
    `${c.label} ${c.section} ${c.keywords ?? ''}`.toLowerCase().includes(q),
  );
}

/**
 * Section header for each row, or null when the row continues the previous
 * section. Derived rather than tracked with a mutable cursor during render.
 */
export function withSectionHeaders(
  commands: Command[],
): { command: Command; header: CommandSection | null }[] {
  return commands.map((command, i) => ({
    command,
    header: commands[i - 1]?.section === command.section ? null : command.section,
  }));
}
