const { dirname } = require('path');
const reactBaseConfig = require('@legendscribe/pokayoke/testing/jest-config-base-react');

// Share a single React instance regardless of npm hoisting.
const reactDir = dirname(require.resolve('react/package.json'));
const reactDomDir = dirname(require.resolve('react-dom/package.json'));

module.exports = {
  ...reactBaseConfig,
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    ...reactBaseConfig.moduleNameMapper,
    '^react$': reactDir,
    '^react-dom$': reactDomDir,
    '^react-dom/(.*)$': `${reactDomDir}/$1`,
    '^react/(.*)$': `${reactDir}/$1`,
  },
};
