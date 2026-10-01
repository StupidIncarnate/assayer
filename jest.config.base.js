const path = require('path');

const base = require('@dungeonmaster/testing/jest-config-base');

const [tsJest, tsJestOptions] = base.transform['^.+\\.tsx?$'];

module.exports = {
  ...base,
  // `source` first, so a test resolves each workspace package through its `exports` map to TypeScript
  // source, never to a built dist.
  testEnvironmentOptions: { customExportConditions: ['source', 'require', 'default'] },
  // Builds every tsc package before any test runs, then calls the published sandbox setup that moves
  // HOME to a temporary directory. The build exists because the integration suite's generated shim
  // requires core's COMPILED adapters, so a stale dist would let it prove old code while the unit
  // suite proves new source. The sandbox call is load-bearing: the published globalTeardown, which
  // this config keeps from the base, deletes HOME recursively when the run ends. The path is absolute
  // through __dirname, never <rootDir>, because every package config spreads this base and <rootDir>
  // is that package.
  globalSetup: path.join(__dirname, 'scripts/jest-global-setup.js'),
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx', '**/bin/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'mjs', 'json'],
  moduleNameMapper: {
    '^@assayer/shared/contracts$': '<rootDir>/../shared/contracts.ts',
    '^@assayer/core/brokers$': '<rootDir>/../core/brokers.ts',
    '^@assayer/core/adapters$': '<rootDir>/../core/adapters.ts',
    '^@assayer/core/contracts$': '<rootDir>/../core/contracts.ts',
    '^@assayer/core/testing$': '<rootDir>/../core/testing.ts',
    '^@assayer/desktop/brokers$': '<rootDir>/../desktop/brokers.ts',
    '^@assayer/desktop/testing$': '<rootDir>/../desktop/testing.ts',
  },
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
