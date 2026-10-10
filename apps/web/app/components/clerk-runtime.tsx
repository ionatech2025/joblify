'use client';

import { Suspense, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { SignIn, SignUp, UserButton } from '@clerk/nextjs';
import { useAuth } from '@clerk/clerk-react';
import { useClerkSlots, type ClerkSlotEntry } from '@/lib/stores/clerk-slots';
import { ClerkClientProvider } from './clerk-provider';

// The part of the Clerk integration that actually imports Clerk's React SDK and
// its components. Loaded only through clerk-host.tsx, and only once a slot has
// registered, so nothing on the first-load path of a page without a Clerk widget
// reaches it — and nothing outside this file may import them (see
// tests/unit/clerk-boundary.test.ts, and the build check in
// scripts/check-bundle-budget.ts that looks for the SDK in first-load chunks).

/** Tells the slots clerk-js has loaded, so they can drop their placeholders. */
function ReadySignal() {
  const { isLoaded } = useAuth();
  const setReady = useClerkSlots((s) => s.setReady);

  useEffect(() => {
    if (isLoaded) setReady(true);
  }, [isLoaded, setReady]);

  return null;
}

function Widget({ slot }: { slot: ClerkSlotEntry }) {
  switch (slot.widget) {
    case 'userButton':
      return <UserButton {...slot.props} />;
    case 'signIn':
      return <SignIn {...slot.props} />;
    case 'signUp':
      return <SignUp {...slot.props} />;
  }
}

export default function ClerkRuntime() {
  const slots = useClerkSlots((s) => s.slots);

  return (
    <ClerkClientProvider>
      <ReadySignal />
      {/* A widget that suspends must not take the page's root with it. */}
      <Suspense fallback={null}>
        {slots.map((slot) => createPortal(<Widget slot={slot} />, slot.node, slot.id))}
      </Suspense>
    </ClerkClientProvider>
  );
}
