import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { moduleGraphProjectionTransformer } from '@assayer/core/module-graph';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'nested-console.ts'), 'utf8');
const relPath = 'src/happy-path/node-global/nested-console/nested-console.ts';

describe('node-global / nested-console — an ambient console.log call inside a named, exported function', () => {
  // The call sits inside `report`'s body, so the walk's flat globalUses channel carries THAT function's
  // scope path, not the module's — the fact `console.log` fires only when a caller invokes `report`,
  // never merely by importing the file.
  it("VALID: {console.log(message) inside report} => one called global use carrying report's scope path", () => {
    const graph = moduleGraphProjectionTransformer({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'nested-console.ts') }) });

    expect(graph).toStrictEqual({
      edges: [],
      references: [],
      globalUses: [
        {
          name: 'console',
          member: 'log',
          called: true,
          args: [{ kind: 'param-ref', paramName: 'message' }],
          line: 2,
          column: 3,
          scopePath: ['*module*', 'report'],
        },
      ],
      envReads: [],
    });
  });

  // `console.log` never runs at import time here — only `report` calling it does — so the module scope
  // earns no entry of its own. `report` is the ONLY entry, exactly as an exported function with no
  // top-level consumption always is.
  it('VALID: {console.log(message) inside report} => report is the only entry, no spurious module entry', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'nested-console.ts') }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'report',
          scopePath: ['*module*', 'report'],
          params: [{ name: 'message', type: { kind: 'string' } }],
          returnType: { kind: 'unknown', text: 'void' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/report/exit@top', kind: 'implicit', guardPath: [], line: 3 }],
        cases: [
          {
            reachesPath: ['*module*/report/exit@top'],
            arrange: [{ kind: 'param', param: 'message', value: 'abc123' }],
            salient: true,
          },
        ],
      },
    ]);
    expect(analysis.undriven).toStrictEqual([]);
    expect(analysis.gaps).toStrictEqual([]);
    expect(analysis.darkSpots).toStrictEqual([]);
    expect(analysis.lints).toStrictEqual([]);
  });
});
