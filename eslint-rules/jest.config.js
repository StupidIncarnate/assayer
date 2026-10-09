'use strict';

/**
 * PURPOSE: Runs this directory's rule tests, standalone from the packages/* ward graph — the same
 *   "separate, standalone jest config outside the main suite" shape manual-smoke-repo's own
 *   `packages/syntax-repository/jest.config.js` uses for `npm run test:syntax`. Rule files here are
 *   plain CommonJS (`eslint.config.js` `require()`s them directly, with no build step), so this needs
 *   no ts-jest transform — Jest runs `.js` files natively.
 *
 * USAGE:
 * npm run test:eslint-rules
 */
module.exports = {
  testEnvironment: 'node',
  rootDir: __dirname,
  testMatch: ['**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/fixtures/'],
};
