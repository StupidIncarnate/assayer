import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'at.ts'), 'utf8');
const relPath = 'src/happy-path/array/at/at.ts';

describe('array / at — a branchless function returning `items.at(index)`', () => {
  // Indexed access: `items.at(index)` returns `number | undefined`, again collapsed to `{ kind: 'number' }`
  // by the non-strict hermetic project (§5.10). Two params: the array-of-number FANS OUT over cardinality
  // — one/empty/many — so the branchless flow reaches its single exit through three derived cases: a
  // salient `[7]` and two grayed twins `[]` and `[7,7]`. The scalar `index` is FIXED at the number
  // placeholder `7` across all three. The out-of-bounds `undefined` the operation can return is invisible
  // here — the arranged values are INPUTS (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function elementAt(items: number[], index: number): number | undefined { return items.at(index) }} => array + number params, return read as number, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'elementAt',
          scopePath: ['*module*', 'elementAt'],
          params: [
            { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
            { name: 'index', type: { kind: 'number' } },
          ],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/elementAt/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/elementAt/return@top',
            arrange: [
              { kind: 'array', param: 'items', value: [7] },
              { kind: 'param', param: 'index', value: 7 },
            ],
            salient: true,
          },
          {
            reachesExit: '*module*/elementAt/return@top',
            arrange: [
              { kind: 'array', param: 'items', value: [] },
              { kind: 'param', param: 'index', value: 7 },
            ],
            salient: false,
          },
          {
            reachesExit: '*module*/elementAt/return@top',
            arrange: [
              { kind: 'array', param: 'items', value: [7, 7] },
              { kind: 'param', param: 'index', value: 7 },
            ],
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
