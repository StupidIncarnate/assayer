import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'unshift.ts'), 'utf8');
const relPath = 'src/happy-path/array/unshift/unshift.ts';

describe('array / unshift — a branchless function returning `items.unshift(value)`', () => {
  // Unlike pop/shift, `unshift` returns the array's NEW length, annotated `number` — so there is no
  // `undefined` to strip and the read matches the annotation exactly. The array-of-number param FANS OUT
  // over cardinality: three cases reach the same exit with a REAL empty array `[]` (salient), a
  // one-element array `[7]` and a many array `[7,7]` (both grayed twins), emitted in empty/one/many order.
  // The scalar `value` pushed onto it is FIXED at the number placeholder `7` across all three. Branchless;
  // the values are INPUTS (P4) and each case asserts only that the flow REACHES the exit.
  it('VALID: {export function prepend(items: number[], value: number): number { return items.unshift(value) }} => array + number params, three cardinality cases', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'unshift.ts') }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'prepend',
          scopePath: ['*module*', 'prepend'],
          params: [
            { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
            { name: 'value', type: { kind: 'number' } },
          ],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/prepend/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/prepend/return@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [] },
              { kind: 'param', param: 'value', value: 7 },
            ],
            salient: true,
          },
          {
            reachesPath: ['*module*/prepend/return@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [7] },
              { kind: 'param', param: 'value', value: 7 },
            ],
            salient: false,
          },
          {
            reachesPath: ['*module*/prepend/return@top'],
            arrange: [
              { kind: 'array', param: 'items', value: [7, 8] },
              { kind: 'param', param: 'value', value: 7 },
            ],
            salient: false,
          },
        ],
      },
    ]);
  });

  it('VALID: {an array-typed param, a builtin array method call} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'unshift.ts') }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
