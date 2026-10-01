// A jsdom environment: this package wraps browser globals (fetch, localStorage, WebSocket,
// indexedDB, document, ...), none of which exist under the base config's Node environment.
const base = require('@dungeonmaster/testing/jest-config-base');

module.exports = {
  ...base,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: {
    // jsdom resolves packages with the `browser` condition unless told otherwise. The base loads
    // MSW's Node server in `setupFilesAfterEnv`, and under `browser` it pulls @mswjs/interceptors'
    // ES-module browser build, which Jest cannot load. `source` stays out: it would point
    // @dungeonmaster/testing's own entry at its `src/` while the base's setup file loads `dist/`,
    // so a test would stage responses on a second MSW server that never answers.
    customExportConditions: ['node', 'require', 'default'],
    url: 'http://localhost',
  },
  setupFiles: ['@dungeonmaster/testing/jsdom-polyfills'],
};
