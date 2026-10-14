const baseConfig = require('../../../jest.config.base.js');

module.exports = {
  ...baseConfig,
  roots: ['<rootDir>/src'],
  // A copied wrapper's test can switch itself to jsdom with an `@jest-environment jsdom` docblock;
  // the polyfills supply the globals jsdom lacks. A node-environment test already has them.
  setupFiles: [...baseConfig.setupFiles, '@legendscribe/lockdown-kit-testing/jsdom-polyfills'],
};
