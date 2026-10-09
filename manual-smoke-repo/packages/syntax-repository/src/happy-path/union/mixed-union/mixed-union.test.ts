import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'mixed-union.ts'), 'utf8');
const relPath = 'src/happy-path/union/mixed-union/mixed-union.ts';

describe('union / mixed-union — a union whose members are NOT all scalars', () => {
  // A value of one member IS a value of the union, so the descriptor keeps both and the fill seam builds
  // the half it can. Degrading to `unknown` on the first non-scalar member would refuse `Marker | string`
  // for the half nothing can build — and there is nothing here that cannot be built.
  it('VALID: {target: Marker | string} => a union descriptor carrying the object beside the string', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'mixed-union.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.entry.params)).toStrictEqual([
      {
        name: 'target',
        // The descriptor renders its members in the CHECKER's order, which is not the source's, so the
        // signature's own rendering rides beside it for a P1 message to name.
        declaredText: 'Marker | string',
        type: {
          kind: 'union',
          members: [
            { kind: 'string' },
            { kind: 'object', typeName: 'Marker', properties: [{ name: 'label', type: { kind: 'string' } }] },
          ],
        },
      },
      { name: 'count', type: { kind: 'number' } },
    ]);
  });

  // The mixed union is filled from its first fillable member — a string — and the scalar branch beside it
  // drives both arms. No gap: nothing here is an input Assayer cannot construct.
  it('VALID: {if (count > 1) beside the mixed union} => both arms driven, the union filled as a string', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'mixed-union.ts') }), relPath });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      cases: [
        {
          reachesPath: ['*module*/pick/return@if:BinaryExpression,id:count,GreaterThanToken,num:1#then'],
          arrange: [
            { kind: 'param', param: 'target', value: 'abc123' },
            { kind: 'param', param: 'count', value: 2 },
          ],
          salient: true,
        },
        {
          reachesPath: ['*module*/pick/return@if:BinaryExpression,id:count,GreaterThanToken,num:1#else'],
          arrange: [
            { kind: 'param', param: 'target', value: 'abc123' },
            { kind: 'param', param: 'count', value: 1 },
          ],
          salient: true,
        },
      ],
      gaps: [],
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
