import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'element-length.ts'), 'utf8');
const relPath = 'src/happy-path/array/element-length/element-length.ts';

describe('array / element-length — a branchless function over an array param', () => {
  // The param types as an ARRAY of number: the walk reads `number[]` structurally rather than dropping
  // it into an opaque `unknown`. Branchless, so all cases reach the one exit — but the array param FANS
  // OUT over cardinality: `derive-cases` emits THREE cases, one per input-breadth an array has. Emit
  // order is `empty, one, many`, so the salient representative is the empty `[]` and the two grayed
  // twins are the single `[7]` and the many `[7,7]`. Each arranges a REAL array of the element type —
  // not a scalar placeholder — so `items.length` runs on an actual array. The values are INPUTS (P4);
  // every case asserts only that the flow REACHES the exit.
  it('VALID: {export function count(items: number[]) { return items.length }} => param typed as array-of-number, three cardinality cases (empty/one/many)', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

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
            reachesPath: ['*module*/count/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: true,
          },
          {
            reachesPath: ['*module*/count/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: false,
          },
          {
            reachesPath: ['*module*/count/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7, 7] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, so `declaredTypes` is empty; nothing is admitted.
  it('VALID: {an array-typed param} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
