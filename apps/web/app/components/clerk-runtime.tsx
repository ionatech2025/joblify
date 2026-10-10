'use client';

import { Suspense, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '@clerk/clerk-react';
import { useClerkSlots } from '@/lib/stores/clerk-slots';
import { ClerkClientProvider } from './clerk-provider';

// The part of the Clerk integration that actually imports @clerk/clerk-react.
// Loaded only through clerk-host.tsx, and only once a slot has registered, so
// nothing on the first-load path of a page without a Clerk widget reaches it.

/** Tells the slots clerk-js has loaded, so they can drop their placeholders. */
function ReadySignal() {
  const { isLoaded } = useAuth();
  const setReady = useClerkSlots((s) => s.setReady);

  useEffect(() => {
    if (isLoaded) setReady(true);
  }, [isLoaded, setReady]);

  return null;
}

export default function ClerkRuntime() {
  const slots = useClerkSlots((s) => s.slots);

  return (
    <ClerkClientProvider>
      <ReadySignal />
      {/* A widget that suspends must not take the page's root with it. */}
      <Suspense fallback={null}>
        {slots.map((slot) => createPortal(slot.element, slot.node, slot.id))}
      </Suspense>
    </ClerkClientProvider>
  );
}
