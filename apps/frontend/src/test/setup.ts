// Vitest setup for jsdom + Ant Design
// Polyfills for APIs used by AntD and React Router in tests.

// matchMedia polyfill
if (typeof window !== 'undefined' && !window.matchMedia) {
  // @ts-ignore
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// ResizeObserver polyfill
if (typeof window !== 'undefined' && !(window as any).ResizeObserver) {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (window as any).ResizeObserver = ResizeObserver as any;
}

// scrollTo polyfill (used by some components)
if (typeof window !== 'undefined' && !window.scrollTo) {
  // @ts-expect-error allow stub for test
  window.scrollTo = () => {};
}
