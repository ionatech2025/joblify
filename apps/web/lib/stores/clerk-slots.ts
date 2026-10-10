import { create } from 'zustand';
import type { ComponentProps } from 'react';
// Type-only: erased at build time. The values are imported by clerk-runtime.tsx
// and by nothing on the first-load path.
import type { SignIn, SignUp, UserButton } from '@clerk/nextjs';

// Registry behind <ClerkSlot> / <ClerkHost>. See clerk-host.tsx for the design;
// this is only the state.
//
// Not persisted and not shared with the UI store: nothing here should ever
// outlive the page.

/**
 * The Clerk widgets a slot can show, by name.
 *
 * Named rather than passed as elements on purpose. A server component that
 * imports `UserButton` from '@clerk/nextjs' — even to render it only for a
 * signed-in visitor — puts that module's chunk, and with it all of
 * @clerk/clerk-react (~27 KB gzip), into the scripts of every page the
 * component's layout is part of: Next ships the client chunks a server module
 * references whether or not the render reaches them. So the server says
 * *which* widget and with what (serialisable) props, and only the lazily
 * loaded runtime imports the components.
 */
export type ClerkWidget =
  | { widget: 'userButton'; props?: ComponentProps<typeof UserButton> }
  | { widget: 'signIn'; props?: ComponentProps<typeof SignIn> }
  | { widget: 'signUp'; props?: ComponentProps<typeof SignUp> };

export type ClerkSlotEntry = ClerkWidget & {
  id: string;
  /** DOM node the widget is portalled into. */
  node: HTMLElement;
};

type ClerkSlotsState = {
  slots: ClerkSlotEntry[];
  /**
   * True from the first registration, and never reset. The provider stays
   * mounted once started: tearing it down and rebuilding it would re-create the
   * Clerk instance (and re-download nothing, but re-initialise everything) for
   * the sake of a slot that unmounted on a client navigation.
   */
  started: boolean;
  /** clerk-js has finished loading; slots may drop their placeholder. */
  ready: boolean;
  register: (entry: ClerkSlotEntry) => () => void;
  setReady: (ready: boolean) => void;
};

export const useClerkSlots = create<ClerkSlotsState>()((set) => ({
  slots: [],
  started: false,
  ready: false,
  register: (entry) => {
    set((s) => ({
      started: true,
      // Replace by id: a slot whose props changed re-registers.
      slots: [...s.slots.filter((x) => x.id !== entry.id), entry],
    }));
    return () => set((s) => ({ slots: s.slots.filter((x) => x.id !== entry.id) }));
  },
  setReady: (ready) => set({ ready }),
}));
