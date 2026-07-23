import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'same-file-predicate.ts'), 'utf8');
const relPath = 'src/happy-path/composition/same-file-predicate/same-file-predicate.ts';

describe('composition / same-file-predicate — a caller guarded by a same-file boolean predicate it calls', () => {
  // THE capability. `classify` guards on `tooBig(x)`, whose whole body is `return n > 50`. The
  // single-file walk reads that guard as a lone opaque `truthy` leaf over the call, so both arms would
  // derive the same `x`. Compose swaps the leaf for `tooBig`'s own `n > 50` rebased onto `x`, and the
  // existing derive-cases machinery yields the sound pair: then wants x > 50, else wants x <= 50.
  it('VALID: {if (tooBig(x))} => one classify entry whose guard is the callee predicate rebased onto x', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(
      analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, branches: fn.branches, cases: fn.cases })),
    ).toStrictEqual([
      {
        name: 'classify',
        access: { kind: 'named' },
        branches: [
          {
            coverageId: '*module*/classify/if:CallExpression,id:tooBig,id:x',
            kind: 'if',
            condition: {
              kind: 'leaf',
              id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf',
              operandParamName: 'x',
              operandType: { kind: 'number' },
              predicate: { kind: 'gt', literal: 50 },
            },
            startLine: 6,
            endLine: 8,
          },
        ],
        cases: [
          {
            reachesExit: '*module*/classify/return@if:CallExpression,id:tooBig,id:x#then',
            arrange: [{ kind: 'param', param: 'x', value: 51 }],
            salient: true,
          },
          {
            reachesExit: '*module*/classify/return@if:CallExpression,id:tooBig,id:x#else',
            arrange: [{ kind: 'param', param: 'x', value: 50 }],
            salient: true,
          },
        ],
      },
    ]);
  });

  // `tooBig` is an unexported predicate with no branches of its own, so it is never projected as an
  // entry — it exists only as the signature `classify`'s guard composes against.
  it('VALID: {a branchless private predicate} => tooBig produces no entry of its own', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.map((fn) => String(fn.entry.name))).toStrictEqual(['classify']);
  });

  // Nothing is admitted: the walk read both scopes perfectly, and composing the guard leaves neither a
  // dark spot, an undriven entry, nor a lint. The file runs clean, which is why it lives in happy-path.
  it('VALID: {composed guard} => admits nothing on any channel', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
