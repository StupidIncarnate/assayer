import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'eq-null.ts'), 'utf8');
const relPath = 'src/happy-path/null/eq-null/eq-null.ts';

const BRANCH = '*module*/checkNull/if:BinaryExpression,id:v,EqualsEqualsEqualsToken,NullKeyword';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

describe('null / eq-null — an explicit equality against the literal null', () => {
  // `null` is a KEYWORD node, read the same way as `true`/`false`: the leaf carries the literal value
  // `null`, never an `unrecognized` predicate. The hermetic walk has no strict-null-checks project
  // config, so the checker itself widens `string | null` to `string` — `operandType` reads the scalar
  // alone, and `declaredText` is what still shows the source spelled a nullable union.
  it('VALID: {v === null} => an eq leaf carrying the literal null, not an unrecognized comparison', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions[0]?.entry.params).toStrictEqual([
      { name: 'v', type: { kind: 'string' }, declaredText: 'string | null' },
    ]);
    expect(analysis.functions[0]?.branches[0]?.condition).toStrictEqual({
      kind: 'leaf',
      id: `${BRANCH}#leaf`,
      operandParamName: 'v',
      operandType: { kind: 'string' },
      predicate: { kind: 'eq', literal: null },
    });
  });

  // THE PAYOFF. Before the reader knew `NullKeyword`, `rightLiteral` stayed `undefined` for every
  // `=== null` comparison, so the predicate came back `unrecognized` and the branch was admitted
  // UNDRIVEN — 0 cases, reading as clean success on a check that never ran. Each arm now arranges the
  // value that actually reaches it, `null` included.
  it('VALID: {v === null} => then arranges v=null and else arranges a non-null string', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [THEN], arrange: [{ kind: 'param', param: 'v', value: null }], salient: true },
      { reachesPath: [ELSE], arrange: [{ kind: 'param', param: 'v', value: 'abc123' }], salient: true },
    ]);
  });

  it('VALID: {a null-equality guard} => nothing admitted: no dark spot, no gap, no undriven, no lint', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({
      darkSpots: analysis.darkSpots,
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ darkSpots: [], gaps: [], undriven: [], lints: [] });
  });
});
