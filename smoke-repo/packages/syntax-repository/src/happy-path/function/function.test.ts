import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'function.ts'), 'utf8');
const relPath = 'src/happy-path/function/function.ts';

describe('function — a branchless exported function', () => {
  // Branchless does not mean untested: the function reaches its single return, so `derive-cases` emits
  // exactly one case for its one exit — arranged with representative param values, asserting only that
  // it REACHES the exit (never the returned value, P4). One entry, no branches, no admission.
  it('VALID: {export function add(a, b) { return a + b }} => one named entry, one return exit, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'add',
          scopePath: ['*module*', 'add'],
          params: [
            { name: 'a', type: { kind: 'number' } },
            { name: 'b', type: { kind: 'number' } },
          ],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/add/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/add/return@top',
            arrange: [
              { kind: 'param', param: 'a', value: 7 },
              { kind: 'param', param: 'b', value: 7 },
            ],
          },
        ],
      },
    ]);
  });

  // Nothing is admitted: a branchless function is fully understood and fully driven.
  it('VALID: {a branchless function} => no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
