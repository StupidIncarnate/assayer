import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'eq-null.ts'), 'utf8');
const relPath = 'src/happy-path/null/eq-null/eq-null.ts';

const BRANCH = '*module*/checkNull/if:BinaryExpression,id:v,EqualsEqualsEqualsToken,NullKeyword';
const THEN = `${BRANCH.replace('/if:', '/return@if:')}#then`;
const ELSE = `${BRANCH.replace('/if:', '/return@if:')}#else`;

// The hermetic walk parses with strict-null-checks on, so `string | null` arrives as a genuine
// two-member union rather than collapsing to plain `string`. `read-type-fact-layer-transformer` has no
// dedicated case for the null type, so its member reads through the generic opaque path as `{ kind:
// 'unknown', text: 'null' }`, sitting beside the real `{ kind: 'string' }` member.
const NULLABLE_STRING = { kind: 'union', members: [{ kind: 'unknown', text: 'null' }, { kind: 'string' }] };

describe('null / eq-null — an explicit equality against the literal null', () => {
  // `null` is a KEYWORD node, read the same way as `true`/`false`: the leaf carries the literal value
  // `null`, never an `unrecognized` predicate. `operandType` carries the full nullable union, and
  // `declaredText` shows the source's own spelling of the same union.
  it('VALID: {v === null} => an eq leaf carrying the literal null, not an unrecognized comparison', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'eq-null.ts') }), relPath });

    expect(analysis.functions[0]?.entry.params).toStrictEqual([
      { name: 'v', type: NULLABLE_STRING, declaredText: 'string | null' },
    ]);
    expect(analysis.functions[0]?.branches[0]?.condition).toStrictEqual({
      kind: 'leaf',
      id: `${BRANCH}#leaf`,
      operandParamName: 'v',
      operandType: NULLABLE_STRING,
      predicate: { kind: 'eq', literal: null },
    });
  });

  // THE PAYOFF. Before the reader knew `NullKeyword`, `rightLiteral` stayed `undefined` for every
  // `=== null` comparison, so the predicate came back `unrecognized` and the branch was admitted
  // UNDRIVEN — 0 cases, reading as clean success on a check that never ran. Each arm now arranges the
  // value that actually reaches it, `null` included.
  it('VALID: {v === null} => then arranges v=null and else arranges a non-null string', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'eq-null.ts') }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesPath: [THEN], arrange: [{ kind: 'param', param: 'v', value: null }], salient: true },
      { reachesPath: [ELSE], arrange: [{ kind: 'param', param: 'v', value: 'abc123' }], salient: true },
    ]);
  });

  it('VALID: {a null-equality guard} => nothing admitted: no dark spot, no gap, no undriven, no lint', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'eq-null.ts') }), relPath });

    expect({
      darkSpots: analysis.darkSpots,
      gaps: analysis.gaps,
      undriven: analysis.undriven,
      lints: analysis.lints,
    }).toStrictEqual({ darkSpots: [], gaps: [], undriven: [], lints: [] });
  });
});
