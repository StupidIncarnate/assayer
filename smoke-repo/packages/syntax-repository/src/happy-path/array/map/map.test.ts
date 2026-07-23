import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'map.ts'), 'utf8');
const relPath = 'src/happy-path/array/map/map.ts';

describe('array / map — a branchless function returning `items.map((n) => n * 2)`', () => {
  // The param types as an ARRAY of number, and the annotated return `number[]` reads structurally as
  // an array of number too. The `(n) => n * 2` callback is a NESTED SCOPE — it is descended (an exit
  // descends its returned expression, so a whole scope inside the `.map(...)` call is reached) but it
  // is projected as NO entry of its own: an anonymous callback arrow with no branching is transparent,
  // exactly like a branchless private, so nothing is admitted for it. Branchless, so all cases reach
  // the one exit — but an array param FANS OUT over cardinality: empty / one / many. Three cases
  // arrange `items` as REAL arrays of the element type — the salient representative `[7]` (one), then
  // the grayed twins `[]` (empty) and `[7, 7]` (many). Emit order is one/empty/many so the salient case
  // is the ordinary non-empty array; all three RUN, `intelligent` grays the two twins. Every value is a
  // real array so `items.map(...)` runs on an actual array. The values are INPUTS (P4); each case
  // asserts only that the flow REACHES the exit.
  it('VALID: {export function double(items: number[]): number[] { return items.map((n) => n * 2) }} => array-of-number param and return, transparent callback, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'double',
          scopePath: ['*module*', 'double'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'array', element: { kind: 'number' } },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/double/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesExit: '*module*/double/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: true,
          },
          {
            reachesExit: '*module*/double/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: false,
          },
          {
            reachesExit: '*module*/double/return@top',
            arrange: [{ kind: 'array', param: 'items', value: [7, 7] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, and neither the builtin `.map` method call nor its
  // anonymous callback arrow is one of the resolver's reportable callees or an admitted scope, so
  // nothing is admitted: no declared types, no dark spot, no undriven, no lint.
  it('VALID: {an array-typed param, a builtin array method call, an anonymous callback arrow} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
