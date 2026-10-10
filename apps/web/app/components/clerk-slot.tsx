'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useClerkSlots } from '@/lib/stores/clerk-slots';

// A page that renders a slot is about to need the provider. Ask for its chunk
// when this module loads rather than when the slot registers after hydration,
// so that request overlaps hydration instead of following it. clerk-host.tsx
// imports the same module, so this is the same request, not a second one.
if (typeof window !== 'undefined') void import('./clerk-runtime');

/**
 * Where a Clerk widget goes. See clerk-host.tsx for how they fit together.
 *
 * Wrap the widget (`<UserButton />`, `<SignIn />`) in this instead of rendering
 * it in place. The widget is *not* rendered here: it is handed to the host,
 * which mounts it — inside the one Clerk provider, loaded on demand — into the
 * empty element this renders. That is what lets the pages that never show a
 * widget skip Clerk's SDK entirely.
 *
 * `fallback` is shown until clerk-js has loaded, so the box is not empty (and
 * does not shift) while it does. It should be the same size as the widget.
 *
 * Neither the fallback nor the widget is wrapped in a box of its own
 * (`display: contents` on the mount point): both take part in the parent's
 * layout exactly as the widget did when it was rendered in place, so adopting a
 * slot changes no spacing, and the placeholder-to-widget swap shifts nothing.
 */
export function ClerkSlot({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const id = useId();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const register = useClerkSlots((s) => s.register);
  const ready = useClerkSlots((s) => s.ready);

  useEffect(() => {
    if (!node) return;
    return register({ id, node, element: children });
  }, [id, node, children, register]);

  return (
    <>
      {!ready && fallback}
      <div ref={setNode} className="contents" />
    </>
  );
}
