import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'uses-console.ts'), 'utf8');
const relPath = 'src/happy-path/node-global/uses-console/uses-console.ts';

describe('node-global / uses-console — an ambient console.log call the file never imports', () => {
  // `console` resolves to nothing the hermetic walk can drive (it is declared in the host lib, not by
  // this file), so the walk RECORDS it as an ambient-external global use — WITHOUT resolving it — for
  // the stitch to type against `@types/node`'s global scope. It is a use, not an import: no edge.
  it('VALID: {console.log(message)} => one called global use for console.log, no import edge', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({
      edges: [],
      references: [],
      globalUses: [{ name: 'console', member: 'log', called: true, args: [{ kind: 'opaque' }], line: 3, column: 1 }],
    });
  });

  // Calling an ambient global is a CONSUMPTION site, so the module scope is a DRIVEN entry — importing
  // the module runs `console.log(...)` and reaches its single exit. One branchless happy-path case that
  // arranges nothing (P4).
  it('VALID: {console.log(message)} => one module entry with one structural happy-path case', () => {
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
        },
        branches: [],
        exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
        cases: [{ reachesExit: '*module*/exit@top', arrange: [] }],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
  });
});
