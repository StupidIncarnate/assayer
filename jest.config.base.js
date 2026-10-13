const base = require('@legendscribe/lockdown-kit-testing/jest-config-base');

const [tsJest, tsJestOptions] = base.transform['^.+\\.tsx?$'];

module.exports = {
  ...base,
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx', '**/bin/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json'],
  transform: {
    ...base.transform,
    '^.+\\.tsx?$': [
      tsJest,
      { ...tsJestOptions, tsconfig: { ...tsJestOptions.tsconfig, jsx: 'react-jsx' } },
    ],
  },
  // The one timeout control, global by rule. Integration tests drive a real wrapped Jest run, which
  // Jest's 5-second default cannot finish. The fix for that is never a per-test `it(..., 120000)`.
  // A per-test timeout hides a slow test from everyone but its author, and Assayer refuses to
  // generate one.
  testTimeout: 120000,
};
