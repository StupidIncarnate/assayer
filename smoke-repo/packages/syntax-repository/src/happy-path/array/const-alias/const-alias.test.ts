import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-alias.ts'), 'utf8');
const relPath = 'src/happy-path/array/const-alias/const-alias.ts';

describe('array / const-alias — a branchless function aliasing its array param through a `const`', () => {
  // `const doubled = items` binds the array param to a local; `doubled.length` reads it back. The alias
  // is pure passthrough — `doubled` IS `items` — so the function still DRIVES the array param, and the
  // param fans out over CARDINALITY: one branchless exit, three cases arranging `items` as empty / one /
  // many. Emit order is `[]`, `[7]`, `[7,7]`, so the salient representative is the empty `[]` and the
  // single + two-element twins are grayed (`salient:false`). The values are INPUTS (P4); each case
  // asserts only that the flow REACHES the same single exit.
  it('VALID: {export function count(items: number[]): number { const doubled = items; return doubled.length }} => array-of-number param, one exit, three cardinality cases', () => {
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
        exits: [{ coverageId: '*module*/count/return@top', kind: 'return', guardPath: [], line: 3 }],
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

  // An array param declares no OBJECT shape, and a `const` alias plus a builtin `.length` read is not one
  // of the resolver's reportable callees, so nothing is admitted: no declared types, no dark spot, no
  // undriven, no lint.
  it('VALID: {an array-typed param aliased through a const, a builtin `.length` read} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
