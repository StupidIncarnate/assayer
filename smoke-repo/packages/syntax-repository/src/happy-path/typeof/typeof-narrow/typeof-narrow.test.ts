import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'typeof-narrow.ts'), 'utf8');
const relPath = 'src/happy-path/typeof/typeof-narrow/typeof-narrow.ts';

describe('typeof / typeof-narrow — `typeof target === \'string\'` narrows a union of scalar members', () => {
  // `target`'s declared union carries both members Untouched — the predicate narrows by which member's
  // runtime tag matches, so both members have to survive the read for either arm to have a value.
  it('VALID: {target: string | number} => a union descriptor carrying both members', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.entry.params)).toStrictEqual([
      { name: 'target', type: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] } },
    ]);
  });

  // The predicate DOES narrow: the then arm needs `target` tagged `'string'`, so it arranges the
  // string member's representative; the else arm needs anything else, so it arranges the number
  // member's. Two cases, no admission — `typeof` is decomposed into the value each arm needs.
  it("VALID: {typeof target === 'string'} => two cases, one per member the tag picks out", () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath }), relPath });

    expect({
      cases: analysis.functions.flatMap((fn) => fn.cases),
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      cases: [
        {
          reachesPath: [
            '*module*/checkTypeof/return@if:BinaryExpression,TypeOfExpression,id:target,EqualsEqualsEqualsToken,str:string#then',
          ],
          arrange: [{ kind: 'param', param: 'target', value: 'abc123' }],
          salient: true,
        },
        {
          reachesPath: [
            '*module*/checkTypeof/return@if:BinaryExpression,TypeOfExpression,id:target,EqualsEqualsEqualsToken,str:string#else',
          ],
          arrange: [{ kind: 'param', param: 'target', value: 7 }],
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
