const { dirname } = require('path');
const baseConfig = require('../../jest.config.base.js');

// Share a single React instance regardless of npm hoisting.
const reactDir = dirname(require.resolve('react/package.json'));
const reactDomDir = dirname(require.resolve('react-dom/package.json'));

module.exports = {
  ...baseConfig,
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  // The base's setupFilesAfterEnv loads MSW's Node interceptors, which subclass the global
  // `Response` at module load. jsdom has no `Response`, so lockdown-kit's published jsdom polyfills
  // put undici's fetch classes on the global first.
  setupFiles: [...baseConfig.setupFiles, '@legendscribe/lockdown-kit-testing/jsdom-polyfills'],
  setupFilesAfterEnv: [...baseConfig.setupFilesAfterEnv, '@testing-library/jest-dom'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/src/**/*.test.[jt]s?(x)'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^react$': reactDir,
    '^react-dom$': reactDomDir,
    '^react-dom/(.*)$': `${reactDomDir}/$1`,
    '^react/(.*)$': `${reactDir}/$1`,
  },
  transform: {
    ...baseConfig.transform,
    // The package's own JavaScript goes through ts-jest as well. The lookahead keeps this entry off
    // node_modules, which the base's node_modules entry handles.
    '^(?!.*/node_modules/).+\\.[jt]sx?$': baseConfig.transform['^.+\\.tsx?$'],
  },
};
