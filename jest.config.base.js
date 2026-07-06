const path = require('path');

// Reference the linked @dungeonmaster/testing package by direct path (bypasses its
// exports map) for the ts-jest AST transformers (register-mock / harness-lifecycle)
// and jest setup file. __dirname is the repo root where this base config lives.
const testingRoot = path.join(__dirname, 'node_modules', '@dungeonmaster', 'testing');
const dungeonmasterTransformers = require(path.join(testingRoot, 'ts-jest/transformers.js'));

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: [path.join(testingRoot, 'src/jest.setup.js')],
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx', '**/bin/**/*.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
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
};
