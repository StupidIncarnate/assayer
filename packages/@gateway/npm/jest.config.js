// A copied wrapper's test can switch itself to jsdom with an `@jest-environment jsdom` docblock
// (react-dom__client's root stub test does); the polyfill supplies the globals jsdom lacks. A
// node-environment test already has them, and the polyfill's own guards make it a no-op there.
const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  // jsdom resolves packages with the `browser` condition unless told otherwise. The base loads MSW's
  // Node server in `setupFilesAfterEnv`, and under `browser` it pulls @mswjs/interceptors' ES-module
  // browser build, which Jest cannot load. `source` stays out: it would point
  // @dungeonmaster/testing's own entry at its `src/` while the base's setup file loads `dist/`, so
  // a test would stage responses on a second MSW server that never answers.
  testEnvironmentOptions: { customExportConditions: ['node', 'require', 'default'] },
  setupFiles: [...(base.setupFiles ?? []), '@dungeonmaster/testing/jsdom-polyfills'],
};
