import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'slice.ts'), 'utf8');
const relPath = 'src/happy-path/array/slice/slice.ts';

describe('array / slice — a branchless function returning `items.slice(1)`', () => {
  // The param types as an ARRAY of number, read structurally like element-length. Unlike `pop`, the
  // return is a fresh `number[]`, so `returnType` reads as `{ kind: 'array', element: { kind: 'number' } }`
  // — no null-stripping happens because slice never annotates `undefined`. Branchless, so all cases reach
  // the one exit — but an array param FANS OUT over cardinality: empty / one / many. Three cases arrange
  // `items` as REAL arrays of the element type — the salient representative `[]` (empty), then the grayed
  // twins `[7]` (one) and `[7, 7]` (many). Emit order is empty/one/many so the salient case is the empty
  // array; all three RUN, `intelligent` grays the two twins. Every value is a real array so
  // `items.slice(1)` runs on an actual array — a scalar placeholder would throw. The values are INPUTS
  // (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function tail(items: number[]): number[] { return items.slice(1) }} => array-of-number param and return, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'tail',
          scopePath: ['*module*', 'tail'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'array', element: { kind: 'number' } },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/tail/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/tail/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: true,
          },
          {
            reachesPath: ['*module*/tail/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: false,
          },
          {
            reachesPath: ['*module*/tail/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7, 7] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, and a builtin array method call is not one of the resolver's
  // reportable callees, so nothing is admitted: no declared types, no dark spot, no undriven, no lint.
  it('VALID: {an array-typed param, a builtin array-returning method call} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
