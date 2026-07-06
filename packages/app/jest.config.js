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
