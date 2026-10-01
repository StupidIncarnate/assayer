import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'intersection.ts'), 'utf8');
const relPath = 'src/happy-path/object/intersection/intersection.ts';

describe('object / intersection — a branchless function over an intersection of two same-file interfaces', () => {
  // `Ay & Bee` is not `isObject()` to the checker — TypeScript keeps an intersection its own type
  // flavor even when every member is an object type — but `getProperties()` on the intersection already
  // returns the MERGED members, so the walk reads it through the exact same branch a plain object takes,
  // with no separate merge logic. Keyless: an inline intersection names no symbol of its own, unlike a
  // `type AB = Ay & Bee` alias, which would carry `typeName: 'AB'`.
  //
  // The arrange is the payoff: `v` is an OBJECT binding carrying a value for both interfaces' properties
  // merged onto one shape, so `v.a` reads a string the case actually supplied.
  it('VALID: {export function combine(v: Ay & Bee) { return v.a }} => param typed as object merging both interfaces, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'combine',
          scopePath: ['*module*', 'combine'],
          params: [
            {
              name: 'v',
              type: {
                kind: 'object',
                properties: [
                  { name: 'a', type: { kind: 'string' } },
                  { name: 'b', type: { kind: 'number' } },
                ],
              },
              declaredText: 'Ay & Bee',
            },
          ],
          returnType: { kind: 'string' },
          line: 9,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/combine/return@top', kind: 'return', guardPath: [], line: 10 }],
        cases: [
          {
            reachesPath: ['*module*/combine/return@top'],
            arrange: [{ kind: 'object', param: 'v', value: { a: 'abc123', b: 7 } }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // Both interfaces declare independently, so BOTH are projected into `declaredTypes` with their own
  // full property lists — the merged, keyless intersection shape itself is not, because it has no name
  // to key a stub on. Nothing is admitted.
  it('VALID: {an intersection of two locally-declared interfaces} => declaredTypes carries both Ay and Bee, and nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      gaps: analysis.gaps,
      lints: analysis.lints,
    }).toStrictEqual({
      declaredTypes: [
        { name: 'Ay', properties: [{ name: 'a', type: { kind: 'string' } }] },
        { name: 'Bee', properties: [{ name: 'b', type: { kind: 'number' } }] },
      ],
      darkSpots: [],
      undriven: [],
      gaps: [],
      lints: [],
    });
  });
});
