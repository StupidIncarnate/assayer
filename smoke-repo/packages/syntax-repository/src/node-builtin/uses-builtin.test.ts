import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'uses-builtin.ts'), 'utf8');
const relPath = 'src/node-builtin/uses-builtin.ts';

describe('node-builtin / uses-builtin — a value imported from a node builtin', () => {
  // The `node:path` specifier is recorded as an import edge; the stitch classifies it a builtin by
  // NAME (builtins do not resolve to a file without ambient types). The binding is USED as a value
  // rather than CALLED, so there is no reference — a called builtin with no usable types is a resolver
  // build error, so the compiled surface imports the value instead.
  it('VALID: {import { sep } from "node:path"} => one builtin import edge and no reference', () => {
    const graph = moduleGraphProjectionTransformer({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(graph).toStrictEqual({
      edges: [{ kind: 'import', specifier: 'node:path', bindings: [{ kind: 'named', name: 'sep' }], line: 1, column: 1 }],
      references: [],
      globalUses: [],
    });
  });

  // Binding an import as a VALUE (`const separator = sep`) is a DATA FLOW into external code — a
  // consumption site Assayer checks like any other — so the module scope is a DRIVEN entry with one
  // branchless happy-path case that arranges nothing (P4). The value flow rides the walk's `valueUses`
  // channel, distinct from `calls`, and the entry gate admits it exactly as it admits a call.
  it('VALID: {export const separator = sep} => one module entry with one structural happy-path case', () => {
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
          exportName: 'separator',
        },
        branches: [],
        exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
        cases: [{ reachesExit: '*module*/exit@top', arrange: [] }],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
  });
});
