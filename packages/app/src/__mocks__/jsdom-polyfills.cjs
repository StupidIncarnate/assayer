// jsdom does not implement matchMedia, which Mantine relies on. ResizeObserver comes from
// `@dungeonmaster/testing/jsdom-polyfills`, which this package's Jest config loads first.
if (typeof window !== 'undefined') {
  window.matchMedia =
    window.matchMedia ||
    ((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }));
}
