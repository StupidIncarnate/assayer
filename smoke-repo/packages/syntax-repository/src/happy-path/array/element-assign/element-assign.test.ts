import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'element-assign.ts'), 'utf8');
const relPath = 'src/happy-path/array/element-assign/element-assign.ts';

describe('array / element-assign — a branchless function assigning `items[2] = value`', () => {
  // `items` reads structurally as an ARRAY of number; `value` is a scalar `number`. The `void` return
  // annotation reads back as `{ kind: 'unknown', text: 'void' }` — the operation is never executed, so
  // there is no value to type (P4). An index WRITE is a plain statement, not a branch or a returned
  // value, so the function falls off the end of its body: one IMPLICIT end-of-body exit, no branches.
  // Branchless, so `derive-cases` emits cases reaching that one exit — but the array param FANS OUT
  // over cardinality, so the one exit is reached by THREE cases: value `[]` (salient), value `[7]`,
  // value `[7, 7]`, emitted in that order. The scalar `value` is fixed to `7` across all three. The
  // values are INPUTS (P4); each case asserts only that the flow REACHES the exit.
  it('VALID: {export function put(items: number[], value: number): void { items[2] = value }} => array-of-number + number params, void read as unknown, three cardinality cases reaching one implicit exit', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'put',
          scopePath: ['*module*', 'put'],
          params: [
            { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
            { name: 'value', type: { kind: 'number' } },
          ],
          returnType: { kind: 'unknown', text: 'void' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/put/exit@top', kind: 'implicit', guardPath: [], line: 3 }],
        cases: [
          {
            reachesPath: ['*module*/put/exit@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [] },
              { kind: 'param', param: 'value', value: 7 },
            ],
            salient: true,
          },
          {
            reachesPath: ['*module*/put/exit@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [7] },
              { kind: 'param', param: 'value', value: 7 },
            ],
            salient: false,
          },
          {
            reachesPath: ['*module*/put/exit@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [7, 7] },
              { kind: 'param', param: 'value', value: 7 },
            ],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param and a scalar param declare no OBJECT shape, and an index write is a plain statement
  // reaching no reportable callee, so nothing is admitted: no declared types, no dark spot, no undriven,
  // no lint.
  it('VALID: {an array-typed param, a scalar param, an index write} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
