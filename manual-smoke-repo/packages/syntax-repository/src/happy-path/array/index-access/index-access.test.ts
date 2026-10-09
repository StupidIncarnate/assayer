import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'index-access.ts'), 'utf8');
const relPath = 'src/happy-path/array/index-access/index-access.ts';

describe('array / index-access — a branchless function returning `items[0]`', () => {
  // The param types as an ARRAY of number, read structurally like element-length; the element read
  // `items[0]` returns a bare `number`. Branchless, so every case reaches the one exit — but the array
  // param FANS OUT over cardinality: `derive-cases` emits THREE cases exercising the real breadth an
  // array has — `empty` ([], the salient representative), `one` ([7]), and `many` ([7,7]) — in that
  // order, each an `array` arrange binding whose recursive value list holds the element type. The values
  // are INPUTS (P4); every case asserts only that the flow REACHES the same exit.
  it('VALID: {export function first(items: number[]): number { return items[0] }} => array-of-number param, three cardinality cases reaching the one exit', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'index-access.ts') }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'first',
          scopePath: ['*module*', 'first'],
          params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
          returnType: { kind: 'number' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/first/return@top', kind: 'return', guardPath: [], line: 2 }],
        cases: [
          {
            reachesPath: ['*module*/first/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [] }],
            salient: true,
          },
          {
            reachesPath: ['*module*/first/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7] }],
            salient: false,
          },
          {
            reachesPath: ['*module*/first/return@top'],
            arrange: [{ kind: 'array', param: 'items', value: [7, 8] }],
            salient: false,
          },
        ],
      },
    ]);
  });

  // An array param declares no OBJECT shape, and an element index read is not one of the resolver's
  // reportable callees, so nothing is admitted: no declared types, no dark spot, no undriven, no lint.
  it('VALID: {an array-typed param, an element index read} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'index-access.ts') }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
