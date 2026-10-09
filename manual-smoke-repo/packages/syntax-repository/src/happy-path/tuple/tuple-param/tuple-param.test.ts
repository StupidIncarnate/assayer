import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'tuple-param.ts'), 'utf8');
const relPath = 'src/happy-path/tuple/tuple-param/tuple-param.ts';

describe('tuple / tuple-param — a branchless function over a fixed-length, heterogeneous tuple param', () => {
  // A tuple is `isObject()` to the checker too, but read as its OWN `tuple` kind before the object
  // branch: one descriptor per fixed position, never an anonymous object enumerating `0`, `1`, `length`
  // and every inherited `ReadonlyArray` method. `declaredText` still carries the source's own spelling,
  // because the descriptor's rendering (`[string, number]`) drops the `readonly` modifier.
  //
  // The arrange is the payoff: `pair` is an ARRAY binding carrying a real two-element array, a string at
  // position 0 and a number at position 1 — never one shared element type repeated.
  it('VALID: {export const readPair = (pair: readonly [string, number]) => …} => param typed as tuple with one descriptor per position, one derived case', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'tuple-param.ts') }), relPath });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'readPair',
          scopePath: ['*module*', 'readPair'],
          params: [
            {
              name: 'pair',
              type: { kind: 'tuple', elements: [{ kind: 'string' }, { kind: 'number' }] },
              declaredText: 'readonly [string, number]',
            },
          ],
          returnType: { kind: 'string' },
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/readPair/return@top', kind: 'return', guardPath: [], line: 1 }],
        cases: [
          {
            reachesPath: ['*module*/readPair/return@top'],
            arrange: [{ kind: 'array', param: 'pair', value: ['abc123', 7] }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // A clean run: no declared shape to key a stub on (a tuple carries no typeName), and nothing admitted.
  it('VALID: {a tuple param} => no declaredTypes, and nothing is admitted', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'tuple-param.ts') }), relPath });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      gaps: analysis.gaps,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], gaps: [], lints: [] });
  });
});
