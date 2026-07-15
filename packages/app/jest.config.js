const { resolve, dirname } = require('path');
const baseConfig = require('../../jest.config.base.js');

// Share a single React instance regardless of npm hoisting.
const reactDir = dirname(require.resolve('react/package.json'));
const reactDomDir = dirname(require.resolve('react-dom/package.json'));
const testingRoot = resolve(__dirname, '../../node_modules/@dungeonmaster/testing');

module.exports = {
  ...baseConfig,
  preset: undefined,
  testEnvironment: 'jsdom',
  testEnvironmentOptions: { customExportConditions: [''], url: 'http://localhost' },
  roots: ['<rootDir>/src'],
  setupFiles: ['<rootDir>/src/__mocks__/jsdom-polyfills.cjs'],
  setupFilesAfterEnv: [resolve(testingRoot, 'src/jest.setup.js'), '@testing-library/jest-dom'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    // Spread, never replace: the base maps @assayer/* to SOURCE. Dropping those makes this package
    // resolve its siblings through package.json exports to their built dist instead, so app tests
    // run against the last `npm run build` while every other package tests the working tree — the
    // two silently disagree until someone rebuilds.
    ...baseConfig.moduleNameMapper,
    '\\.(css|less|scss)$': '<rootDir>/src/__mocks__/style-mock.cjs',
    '^react$': reactDir,
    '^react-dom$': reactDomDir,
    '^react-dom/(.*)$': `${reactDomDir}/$1`,
    '^react/(.*)$': `${reactDir}/$1`,
  },
  transform: {
    '^.+\\.m?[jt]sx?$': [
      'ts-jest',
      {
        tsconfig: resolve(__dirname, 'tsconfig.test.json'),
        astTransformers: {
          before: [{ path: resolve(testingRoot, 'ts-jest/proxy-mock-transformer.js') }],
        },
      },
    ],
  },
};
