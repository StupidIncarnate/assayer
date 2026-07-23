import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'nested.ts'), 'utf8');
const relPath = 'src/happy-path/array/nested/nested.ts';

describe('array / nested — a branchless function returning `matrix.length` over `number[][]`', () => {
  // The param types as a NESTED array — `{ kind: 'array', element: { kind: 'array', element: number } }`
  // — read structurally, the outer and inner element types both recovered rather than collapsed to an
  // opaque `unknown`. Branchless, so `derive-cases` emits cases reaching the one exit; but an array param
  // FANS OUT over cardinality, so the single exit is reached three ways — empty / one / many — arranged
  // as REAL 2D arrays. Only the TOP-LEVEL param varies over cardinality; each inner array is fixed at the
  // `one` count, so `many` is `[[7],[7]]`, never `[[7,7],[7,7]]`. Emit order is `one, empty, many`, so the
  // salient representative is the ordinary non-empty `[[7]]` and the empty/many twins are grayed. The
  // values are INPUTS (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function rows(matrix: number[][]): number { return matrix.length }} => nested-array param, three cardinality cases reaching one exit', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'rows',
          scopePath: ['*module*', 'rows'],
          params: [
            {
              name: 'matrix',
              type: { kind: 'array', element: { kind: 'array', element: { kind: 'number' } } },
            },
          ],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/rows/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/rows/return@top',
            arrange: [{ kind: 'array', param: 'matrix', value: [[7]] }],
            salient: true,
          },
          {
            reachesExit: '*module*/rows/return@top',
            arrange: [{ kind: 'array', param: 'matrix', value: [] }],
            salient: false,
          },
          {
            reachesExit: '*module*/rows/return@top',
            arrange: [{ kind: 'array', param: 'matrix', value: [[7], [7]] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // A nested array param declares no OBJECT shape, and `.length` is a plain property read (not one of the
  // resolver's reportable callees), so nothing is admitted: no declared types, no dark spot, no undriven,
  // no lint.
  it('VALID: {a nested-array-typed param, a `.length` read} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
