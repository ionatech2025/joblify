'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Skeleton } from '@/app/components/ui/skeleton';

// Bio coach — streams suggestions from Sonnet via AI Gateway. Lives on the
// profile page as an "Improve my bio" assist. The current bio is sent as request
// context; the server folds it into the system prompt.
//
// Only the trigger is in the page bundle. The panel — and with it the whole AI
// SDK — is fetched on first open. This page is where onboarding lands every new
// job seeker, and almost none of them press this button, so the SDK has no
// business being in their first-load JS.
//
// ssr:false because the panel is pure client state (a chat session); there is
// nothing to prerender, and it can only ever mount from a click.
const BioCoachPanel = dynamic(
  () => import('./bio-coach-panel').then((m) => m.BioCoachPanel),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-card border-border bg-brand-subtle shadow-soft mt-4 border p-4">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="mt-3 h-20 w-full" />
        <Skeleton className="rounded-control mt-4 h-10 w-full" />
      </div>
    ),
  },
);

export function BioCoach({ currentBio }: { currentBio: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" onClick={() => setOpen(true)} icon={<Sparkles />}>
        Improve my bio with AI
      </Button>
    );
  }

  return <BioCoachPanel currentBio={currentBio} onClose={() => setOpen(false)} />;
}
