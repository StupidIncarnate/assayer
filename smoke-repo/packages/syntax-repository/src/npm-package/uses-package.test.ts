import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'uses-package.ts'), 'utf8');
const relPath = 'src/npm-package/uses-package.ts';

describe('npm-package / uses-package — a call into a function imported from a package', () => {
  // A BARE specifier (`vendored-fixture`) is recorded verbatim; the stitch resolves it through node's
  // module resolution to a package and pulls its declared signature from the shipped `.d.ts`.
  it('VALID: {import { greet } from "vendored-fixture"; greet(\'world\')} => one package import edge and one reference', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({
      edges: [{ kind: 'import', specifier: 'vendored-fixture', bindings: [{ kind: 'named', name: 'greet' }], line: 1, column: 1 }],
      references: [{ specifier: 'vendored-fixture', importedName: 'greet', line: 3, column: 22 }],
      globalUses: [],
    });
  });

  // Calling a package import is a CONSUMPTION site, so the module scope is a DRIVEN entry with one
  // branchless happy-path case that arranges nothing (P4).
  it('VALID: {export const hello = greet(\'world\')} => one module entry with one structural happy-path case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: '*module*',
          scopePath: ['*module*'],
          params: [],
          returnType: { kind: 'unknown', text: 'void' },
          line: 1,
          access: { kind: 'module' },
          exportName: 'hello',
        },
        branches: [],
        exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
        cases: [{ reachesExit: '*module*/exit@top', arrange: [] }],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
  });
});
