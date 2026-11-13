// jsdom has no ResizeObserver, and <DirtyBar> observes its own height, so every
// form test needs one. Files that assert on resize callbacks stub their own.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
