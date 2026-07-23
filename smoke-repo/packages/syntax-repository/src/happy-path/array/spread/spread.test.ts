import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'spread.ts'), 'utf8');
const relPath = 'src/happy-path/array/spread/spread.ts';

describe('array / spread — a branchless function returning `[...items]`', () => {
  // `copy` spreads its array param into a fresh array, so both the param and the return read
  // structurally as `{ kind: 'array', element: { kind: 'number' } }`. Branchless, so all cases reach
  // the one exit — but an array param FANS OUT over cardinality: empty / one / many. Three cases arrange
  // `items` as REAL arrays of the element type — the salient representative `[7]` (one), then the grayed
  // twins `[]` (empty) and `[7, 7]` (many). Emit order is one/empty/many so the salient case is the
  // ordinary non-empty array; all three RUN, `intelligent` grays the two twins. The values are INPUTS
  // (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function copy(items: number[]): number[] { return [...items] }} => array-of-number param and return, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'copy',
          scopePath: ['*module*', 'copy'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'array', element: { kind: 'number' } },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/copy/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/copy/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: true,
          },
          {
            reachesExit: '*module*/copy/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: false,
          },
          {
            reachesExit: '*module*/copy/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [7, 7] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param and return declare no OBJECT shape, and a spread element is not a callee, so nothing
  // is admitted: no declared types, no dark spot, no undriven, no lint.
  it('VALID: {an array-typed param spread into a new array} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
