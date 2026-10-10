'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { useClerkSlots, type ClerkWidget } from '@/lib/stores/clerk-slots';

/**
 * Where a Clerk widget goes. See clerk-host.tsx for how they fit together.
 *
 * Use this instead of rendering the widget in place, and name the widget rather
 * than importing it: `<ClerkSlot widget="userButton" />`. The widget is mounted
 * by the host — inside the one Clerk provider, loaded on demand — into the
 * empty element this renders. That is what lets the pages that never show a
 * widget skip Clerk's SDK entirely, and importing a Clerk component from a
 * server component would undo it (see lib/stores/clerk-slots.ts).
 *
 * `fallback` is shown until clerk-js has loaded, so the box is not empty (and
 * does not shift) while it does. It should be the same size as the widget.
 *
 * Neither the fallback nor the widget is wrapped in a box of its own
 * (`display: contents` on the mount point): both take part in the parent's
 * layout exactly as the widget did when it was rendered in place, so adopting a
 * slot changes no spacing, and the placeholder-to-widget swap shifts nothing.
 */
export function ClerkSlot({
  fallback,
  ...widget
}: ClerkWidget & {
  fallback?: ReactNode;
}) {
  const id = useId();
  const [node, setNode] = useState<HTMLElement | null>(null);
  const register = useClerkSlots((s) => s.register);
  const ready = useClerkSlots((s) => s.ready);

  // Props arrive from the server as a fresh object on every render of the
  // parent; key the registration on their content so an equal re-render does
  // not unregister and re-register the slot.
  const name = widget.widget;
  const propsKey = JSON.stringify(widget.props ?? null);

  useEffect(() => {
    if (!node) return;
    const entry = { id, node, widget: name, props: JSON.parse(propsKey) ?? undefined };
    return register(entry as Parameters<typeof register>[0]);
  }, [id, node, name, propsKey, register]);

  return (
    <>
      {!ready && fallback}
      <div ref={setNode} className="contents" />
    </>
  );
}
