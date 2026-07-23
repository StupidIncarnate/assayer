import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'uses-process.ts'), 'utf8');
const relPath = 'src/happy-path/node-global/uses-process/uses-process.ts';

describe('node-global / uses-process — ambient process.env access plus a process.cwd() call', () => {
  // Two ambient uses of `process`, which resolves to nothing here: a member ACCESS (`process.env`,
  // uncalled) and a member CALL (`process.cwd()`). Each is recorded WITHOUT resolving — the stitch
  // gives the access its member type and the call its signature from `@types/node`'s global scope.
  it('VALID: {process.env access + process.cwd() call} => two global uses, one uncalled, one called', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({
      edges: [],
      references: [],
      globalUses: [
        { name: 'process', member: 'env', called: false, args: [], line: 1, column: 21 },
        { name: 'process', member: 'cwd', called: true, args: [], line: 3, column: 20 },
      ],
      // The bare `process.env.MODE` read is captured as an env read naming the property, with no
      // literal (it is assigned, not compared) — so `MODE` is a stub reader with a guessed value.
      envReads: [{ property: 'MODE', literals: [] }],
    });
  });

  // Calling an ambient global (`process.cwd()`) is a CONSUMPTION site, so the module scope is a DRIVEN
  // entry with one branchless happy-path case that arranges nothing (P4). The uncalled `process.env`
  // access alone would not project it — a value read is not a call — but the `process.cwd()` call does.
  it('VALID: {export const dir = process.cwd()} => one module entry with one structural happy-path case', () => {
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
        cases: [{ reachesExit: '*module*/exit@top', arrange: [], salient: true }],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
  });
});
