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
  // Every generated test runs Assayer's own nested Jest on its specimen. The first run in a worker
  // starts that nested runner and its compiler, which takes far longer than Jest's default 5 seconds.
  // One timeout for the whole repo, never one per test.
  testTimeout: 60000,
  globalSetup: path.join(__dirname, 'global-setup.js'),
  globalTeardown: path.join(__dirname, 'global-teardown.js'),
  // Each worker also hosts Assayer's nested Jest and its compiler. One worker per core ran a 62 GB
  // machine out of memory, so the repo caps the count.
  maxWorkers: process.env.MAX_WORKERS ? parseInt(process.env.MAX_WORKERS, 10) : 4,
  // Recycle workers when idle memory exceeds 1 GB to prevent memory accumulation across test suites.
  workerIdleMemoryLimit: '1GB',
  // Derived from tsconfig `paths` so the typechecker and the runtime resolve the analyzer
  // identically. A mapping added for one is honored by the other.
  moduleNameMapper: pathsToModuleNameMapper(config.compilerOptions.paths, {
    prefix: `${__dirname}/`,
  }),
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: tsconfigPath, diagnostics: false }],
  },
};
