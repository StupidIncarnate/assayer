const path = require('path');

const assayerRoot = path.join(__dirname, '..', '..', '..');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@assayer/core/extract-analysis$': path.join(
      assayerRoot,
      'packages/core/src/adapters/ts-morph/extract-analysis/ts-morph-extract-analysis-adapter.ts',
    ),
    '^@assayer/shared/contracts$': path.join(assayerRoot, 'packages/shared/contracts.ts'),
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: path.join(__dirname, 'tsconfig.json') }],
  },
};
