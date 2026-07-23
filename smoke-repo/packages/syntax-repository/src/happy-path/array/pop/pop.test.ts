import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'pop.ts'), 'utf8');
const relPath = 'src/happy-path/array/pop/pop.ts';

describe('array / pop — a branchless function returning `items.pop()`', () => {
  // The param types as an ARRAY of number, read structurally like element-length. The annotated return
  // is `number | undefined`, but the walk reads it as `{ kind: 'number' }`: the hermetic project runs
  // without `strictNullChecks` (§5.10 — the same in-memory project that keeps `node_modules` out), so
  // the checker strips `undefined` from the union and hands back a bare `number`. Branchless, so all
  // cases reach the one exit — but an array param FANS OUT over cardinality: empty / one / many. Three
  // cases arrange `items` as REAL arrays of the element type — the salient representative `[7]` (one),
  // then the grayed twins `[]` (empty) and `[7, 7]` (many). Emit order is one/empty/many so the salient
  // case is the ordinary non-empty array; all three RUN, `intelligent` grays the two twins. Every value
  // is a real array so `items.pop()` runs on an actual array — a scalar placeholder would throw. The
  // values are INPUTS (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function popLast(items: number[]): number | undefined { return items.pop() }} => array-of-number param, return read as number, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'popLast',
          scopePath: ['*module*', 'popLast'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/popLast/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/popLast/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: true,
          },
          {
            reachesExit: '*module*/popLast/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: false,
          },
          {
            reachesExit: '*module*/popLast/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [7, 7] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, and a builtin array method call is not one of the resolver's
  // reportable callees, so nothing is admitted: no declared types, no dark spot, no undriven, no lint.
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
