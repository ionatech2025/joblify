import { create } from 'zustand';
import type { ReactNode } from 'react';

// Registry behind <ClerkSlot> / <ClerkHost>. See clerk-host.tsx for the design;
// this is only the state.
//
// Not persisted and not shared with the UI store: nothing here should ever
// outlive the page.

export type ClerkSlotEntry = {
  id: string;
  /** DOM node the slot's element is portalled into. */
  node: HTMLElement;
  /** The Clerk widget (or any element that needs the Clerk context). */
  element: ReactNode;
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
      // Replace by id: a slot whose children changed re-registers.
      slots: [...s.slots.filter((x) => x.id !== entry.id), entry],
    }));
    return () => set((s) => ({ slots: s.slots.filter((x) => x.id !== entry.id) }));
  },
  setReady: (ready) => set({ ready }),
}));
