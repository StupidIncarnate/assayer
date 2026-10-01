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
  // The `.tsx` half pairs with a `.test.tsx`, exactly as a `.ts` specimen pairs with a `.test.ts` —
  // the same extension-matched convention `specimen-catalogue`'s `structuralErrors` checks.
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
  // Derived from tsconfig `paths` so the typechecker and the runtime resolve the analyzer
  // identically — a mapping added for one is automatically honored by the other.
  moduleNameMapper: pathsToModuleNameMapper(config.compilerOptions.paths, {
    prefix: `${__dirname}/`,
  }),
  transform: {
    // One entry covering both TypeScript extensions, the same widening `run-execute-cases-broker` uses
    // for the wrapped runner — a `.tsx` test file needs ts-jest exactly as a `.ts` one does, whether or
    // not it contains JSX itself.
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: tsconfigPath }],
  },
};
