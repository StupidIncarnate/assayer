const path = require('path');

// Reference the linked @dungeonmaster/testing package by direct path (bypasses its
// exports map) for the ts-jest AST transformers (register-mock / harness-lifecycle)
// and jest setup file. __dirname is the repo root where this base config lives.
const testingRoot = path.join(__dirname, 'node_modules', '@dungeonmaster', 'testing');
const dungeonmasterTransformers = require(path.join(testingRoot, 'ts-jest/transformers.js'));

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Builds packages/*/dist before any test runs, so the integration suite (whose generated shim
  // requires core's COMPILED adapters) can never prove old code while the unit suite proves new
  // source. Absolute via __dirname, never <rootDir>: this base is spread into every package's config,
  // where <rootDir> is that package — a relative path would resolve to five different places.
  globalSetup: path.join(__dirname, 'scripts/jest-global-setup.js'),
  setupFilesAfterEnv: [path.join(testingRoot, 'src/jest.setup.js')],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx', '**/bin/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@assayer/shared/contracts$': '<rootDir>/../shared/contracts.ts',
    '^@assayer/core/brokers$': '<rootDir>/../core/brokers.ts',
    '^@assayer/core/contracts$': '<rootDir>/../core/contracts.ts',
    '^@assayer/core/testing$': '<rootDir>/../core/testing.ts',
    '^@assayer/desktop/brokers$': '<rootDir>/../desktop/brokers.ts',
    '^@assayer/desktop/testing$': '<rootDir>/../desktop/testing.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          allowJs: true,
          esModuleInterop: true,
          skipLibCheck: true,
          jsx: 'react-jsx',
        },
        astTransformers: {
          before: dungeonmasterTransformers,
        },
      },
    ],
  },
  coverageDirectory: 'coverage',
  verbose: false,
  detectOpenHandles: true,
  forceExit: true,
  // The ONE timeout control, global by rule. Integration tests drive a real wrapped Jest run, which
  // jest's 5s default cannot finish — and the fix for that must never be a per-test `it(..., 120000)`
  // knob. A per-test timeout is a tuning escape hatch: it hides a slow test from everyone but the
  // person who wrote it, and it is precisely the anti-pattern Assayer refuses to generate.
  testTimeout: 120000,
};
