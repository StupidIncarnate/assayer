// A copied wrapper's test can switch itself to jsdom with an `@jest-environment jsdom` docblock
// (react-dom__client's root stub test does); the polyfill supplies the globals jsdom lacks. A
// node-environment test already has them, and the polyfill's own guards make it a no-op there.
const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  setupFiles: [...(base.setupFiles ?? []), '@dungeonmaster/testing/jsdom-polyfills'],
};
