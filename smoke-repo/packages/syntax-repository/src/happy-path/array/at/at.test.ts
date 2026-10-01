import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'at.ts'), 'utf8');
const relPath = 'src/happy-path/array/at/at.ts';

// The hermetic walk parses with strict-null-checks on, so `number | undefined` arrives as a genuine
// two-member union rather than collapsing to plain `number`. `read-type-fact-layer-transformer` has no
// dedicated case for the undefined type, so its member reads through the generic opaque path as
// `{ kind: 'unknown', text: 'undefined' }`, sitting beside the real `{ kind: 'number' }` member.
const OPTIONAL_NUMBER = { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] };

describe('array / at — a branchless function returning `items.at(index)`', () => {
  // Indexed access: `items.at(index)` returns `number | undefined`, now read as a real union — an
  // out-of-bounds index genuinely returns nothing, and the analysis says so. Two params: the
  // array-of-number FANS OUT over cardinality — empty/one/many — so the branchless flow reaches its
  // single exit through three derived cases: a salient `[]` and two grayed twins `[7]` and `[7,7]`. The
  // scalar `index` is FIXED at the number placeholder `7` across all three. The arranged values are
  // INPUTS (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function elementAt(items: number[], index: number): number | undefined { return items.at(index) }} => array + number params, return read as a real optional union, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'elementAt',
          scopePath: ['*module*', 'elementAt'],
          params: [
            { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
            { name: 'index', type: { kind: 'number' } },
          ],
          returnType: OPTIONAL_NUMBER,
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/elementAt/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/elementAt/return@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [] },
              { kind: 'param', param: 'index', value: 7 },
            ],
            salient: true,
          },
          {
            reachesPath: ['*module*/elementAt/return@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [7] },
              { kind: 'param', param: 'index', value: 7 },
            ],
            salient: false,
          },
          {
            reachesPath: ['*module*/elementAt/return@top'],
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
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
