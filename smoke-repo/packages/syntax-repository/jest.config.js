const path = require('path');

const { pathsToModuleNameMapper } = require('ts-jest');
const ts = require('typescript');

const tsconfigPath = path.join(__dirname, 'tsconfig.json');

// Read through the TypeScript API rather than require(): tsconfig.json carries comments, which
// JSON.parse would choke on.
const { config } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.test.ts'],
  // Derived from tsconfig `paths` so the typechecker and the runtime resolve the analyzer
  // identically — a mapping added for one is automatically honored by the other.
  moduleNameMapper: pathsToModuleNameMapper(config.compilerOptions.paths, {
    prefix: `${__dirname}/`,
  }),
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: tsconfigPath }],
  },
};
