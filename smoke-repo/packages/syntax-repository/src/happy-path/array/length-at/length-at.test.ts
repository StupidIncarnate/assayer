import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'length-at.ts'), 'utf8');
const relPath = 'src/happy-path/array/length-at/length-at.ts';

const OPTIONAL_NUMBER = { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] };

describe('array / length-at — array parameter length flowing into .at() on an array literal', () => {
  it('VALID: {export function pickByLength(someArr: number[]): number | undefined} => fans out across empty, one, many, and out-of-bounds length 3', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'length-at.ts') }) });

    expect(analysis.functions).toStrictEqual([
      {
        entry: {
          name: 'pickByLength',
          scopePath: ['*module*', 'pickByLength'],
          params: [
            { name: 'someArr', type: { kind: 'array', element: { kind: 'number' } } },
          ],
          returnType: OPTIONAL_NUMBER,
          line: 1,
          access: { kind: 'named' },
        },
        branches: [],
        exits: [{ coverageId: '*module*/pickByLength/return@top', kind: 'return', guardPath: [], line: 3 }],
        cases: [
          {
            reachesPath: ['*module*/pickByLength/return@top'],
            arrange: [
              { kind: 'array', param: 'someArr', value: [] },
            ],
            salient: true,
          },
          {
            reachesPath: ['*module*/pickByLength/return@top'],
            arrange: [
              { kind: 'array', param: 'someArr', value: [7] },
            ],
            salient: false,
          },
          {
            reachesPath: ['*module*/pickByLength/return@top'],
            arrange: [
              { kind: 'array', param: 'someArr', value: [7, 8] },
            ],
            salient: false,
          },
          {
            reachesPath: ['*module*/pickByLength/return@top'],
            arrange: [
              { kind: 'array', param: 'someArr', value: [7, 8, 9] },
            ],
            salient: false,
          },
        ],
      },
    ]);
  });

  it('VALID: {an array-typed param whose length indexes an array literal} => no declared object types, no dark spots, no undriven, no lints', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'length-at.ts') }) });

    expect({
      declaredTypes: analysis.declaredTypes,
      darkSpots: analysis.darkSpots,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ declaredTypes: [], darkSpots: [], undriven: [], lints: [] });
  });
});
