import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'element-length.ts'), 'utf8');
const relPath = 'src/happy-path/array/element-length/element-length.ts';

describe('array / element-length — a branchless function over an array param', () => {
  // The param types as an ARRAY of number: the walk reads `number[]` structurally rather than dropping
  // it into an opaque `unknown`. Branchless, so `derive-cases` emits exactly one case for the one exit,
  // arranged with the array param's placeholder value and asserting only that it REACHES the exit (P4).
  it('VALID: {export function count(items: number[]) { return items.length }} => param typed as array-of-number, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'count',
          scopePath: ['*module*', 'count'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/count/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/count/return@top',
            arrange: [{ kind: 'param', param: 'items', value: 'abc123' }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, so `declaredTypes` is empty; nothing is admitted.
  it('VALID: {an array-typed param} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
