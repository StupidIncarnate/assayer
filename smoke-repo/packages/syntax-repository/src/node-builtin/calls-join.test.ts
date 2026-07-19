import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'calls-join.ts'), 'utf8');
const relPath = 'src/node-builtin/calls-join.ts';

describe('node-builtin / calls-join — a CALLED value imported from a node builtin', () => {
  // Unlike `uses-builtin.ts`, which uses its binding as a value, this CALLS `join`. The walk records
  // the `node:path` import edge and the call reference; the stitch classifies it a builtin and — with
  // `@types/node` in the second project — pulls `join`'s `{params,returnType}` signature rather than
  // raising no-usable-types.
  it('VALID: {import { join } from "node:path"; join(a, b)} => one builtin import edge and one reference', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({
      edges: [{ kind: 'import', specifier: 'node:path', bindings: [{ kind: 'named', name: 'join' }], line: 1, column: 1 }],
      references: [{ specifier: 'node:path', importedName: 'join', line: 3, column: 21 }],
      globalUses: [],
    });
  });

  // Calling a builtin import is a CONSUMPTION site, so the module scope is a DRIVEN entry with one
  // branchless happy-path case that arranges nothing (P4).
  it('VALID: {export const full = join(\'a\', \'b\')} => one module entry with one structural happy-path case', () => {
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
          exportName: 'full',
        },
        branches: [],
        exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
        cases: [{ reachesExit: '*module*/exit@top', arrange: [] }],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
  });
});
