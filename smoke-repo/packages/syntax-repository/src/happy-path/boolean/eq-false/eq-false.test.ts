import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'eq-false.ts'), 'utf8');
const relPath = 'src/happy-path/boolean/eq-false/eq-false.ts';

const BRANCH = '*module*/check/if:BinaryExpression,id:active,EqualsEqualsEqualsToken,FalseKeyword';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('boolean / eq-false — an explicit equality against the literal false', () => {
  // A boolean is a closed two-value enumeration: the arm violating `active === false` is `active`'s
  // ONLY other value, `true` — the same closed-set treatment a union's `!== member` already gets, read
  // here off `type.kind === 'boolean'` rather than off a union's members.
  it('VALID: {active === false} => an eq leaf carrying its own literal, not a negated read', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions[0]?.branches[0]?.condition).toStrictEqual({
      kind: 'leaf',
      id: `${BRANCH}#leaf`,
      operandParamName: 'active',
      operandType: { kind: 'boolean' },
      predicate: { kind: 'eq', literal: false },
    });
  });

  // THE PAYOFF. Before the boolean gets its own complement, the violating arm of `=== false` names no
  // value distinct from the satisfying one — the seam's own fallback fill for an unconstrained boolean
  // IS `false` — so the else case would arrange `active: false` too, and the case predicting the else
  // exit would fail against correct code. Each arm now arranges the value that actually reaches it.
  it('VALID: {active === false} => then arranges active=false and else arranges active=true', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [THEN], arrange: [{ kind: 'param', param: 'active', value: false }], salient: true },
      { reachesPath: [ELSE], arrange: [{ kind: 'param', param: 'active', value: true }], salient: true },
    ]);
  });

  it('VALID: {an eq-false guard} => nothing admitted: no dark spot, no gap, no undriven, no lint', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      darkSpots: analysis.darkSpots,
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ darkSpots: [], gaps: [], undriven: [], lints: [] });
  });
});
