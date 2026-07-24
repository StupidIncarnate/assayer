import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'shift.ts'), 'utf8');
const relPath = 'src/happy-path/array/shift/shift.ts';

describe('array / shift — a branchless function returning `items.shift()`', () => {
  // The mirror of pop from the front of the array: same array-of-number param, same `number | undefined`
  // annotation collapsed to `{ kind: 'number' }` by the non-strict hermetic project (§5.10). Branchless,
  // but the single array param FANS OUT over cardinality: three cases reach the one exit, arranged with
  // REAL arrays of the element type so `items.shift()` runs on an actual array. Emit order fixes salience
  // — the empty `[]` is the salient representative; the one-element `[7]` and many `[7,7]` twins are the
  // grayed breadth (all run under `thorough`; only `intelligent` grays the two). Values are INPUTS (P4);
  // each case asserts only that the flow REACHES the exit.
  it('VALID: {export function takeFirst(items: number[]): number | undefined { return items.shift() }} => array-of-number param, return read as number, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'takeFirst',
          scopePath: ['*module*', 'takeFirst'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/takeFirst/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/takeFirst/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: true,
          },
          {
            reachesPath: ['*module*/takeFirst/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: false,
          },
          {
            reachesPath: ['*module*/takeFirst/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7, 7] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  it('VALID: {an array-typed param, a builtin array method call} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
