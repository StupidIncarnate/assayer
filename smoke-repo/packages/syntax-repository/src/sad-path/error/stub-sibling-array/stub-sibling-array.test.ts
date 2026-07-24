import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'stub-sibling-array.ts'), 'utf8');
const relPath = 'src/sad-path/error/stub-sibling-array/stub-sibling-array.ts';
// The syntax-repository package root, so stub-realize resolves against the same layout a real run does.
const root = resolve(__dirname, '..', '..', '..', '..');

const GUARD =
  'if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a';
const THEN = `*module*/merge/return@${GUARD}#then`;
const ELSE = `*module*/merge/return@${GUARD}#else`;

// The fill under test. `extra` is a `number[]` the case does not steer, so it is filled — with the
// scalar string placeholder rather than a real array.
const EXTRA_FILL = { kind: 'param', param: 'extra', value: 'abc123' };

describe('error / stub-sibling-array — a sibling ARRAY param of a stub-realized entry is filled with a scalar string', () => {
  // The same defect `happy-path/array/sibling-fill` proves is FIXED, at a second fill site that was
  // missed. Those two specimens are the pair worth reading together: an unsteered `number[]` beside a
  // funnelled array param gets a real `[7]`, while an unsteered `number[]` beside a stub-realized OBJECT
  // param gets `'abc123'` — because stub-realize arranges non-object params through the scalar
  // representative directly rather than through the shared `fill-param` seam the funnel uses.
  //
  // Ordinary code: a function branching on a config member and using an array argument. Both arms are
  // driven correctly — the object side works — so the only thing wrong is the sibling's value.
  //
  // A RATCHET: the code is correct, so the day stub-realize fills through the same seam the funnel does,
  // `extra` becomes `[7]`, both cases pass, and this file MOVES to happy-path.
  it('VALID: {an unsteered array sibling of a stub-realized object param} => filled with the scalar placeholder, not an array', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = stubRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath, overlays: [] });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      {
        reachesPath: [THEN],
        arrange: [{ kind: 'object', param: 'config', value: { mode: 'a' } }, EXTRA_FILL],
        salient: true,
      },
      {
        reachesPath: [ELSE],
        arrange: [{ kind: 'object', param: 'config', value: { mode: 'abc123' } }, EXTRA_FILL],
        salient: true,
      },
    ]);
  });

  // The object half is CORRECT, which is what localises the defect: stub-realize resolved `Config`,
  // arranged `mode` per arm, and cleared the per-file undriven admission. Only the sibling is wrong, so
  // this specimen cannot be read as "object arrange is broken".
  it('VALID: {the object param beside it} => driven correctly from its declared shape, nothing admitted', () => {
    const walked = tsMorphWalkFileAdapter({ source, relPath });
    const analysis = stubRealizeBroker({ analysis: analyzeFileBroker({ walked, relPath }), walked, root, relPath, overlays: [] });

    expect({
      configArranges: analysis.functions.flatMap((fn) => fn.cases.map((testCase) => testCase.arrange[0])),
      undriven: analysis.undriven,
      darkSpots: analysis.darkSpots,
      lints: analysis.lints,
    }).toStrictEqual({
      configArranges: [
        { kind: 'object', param: 'config', value: { mode: 'a' } },
        { kind: 'object', param: 'config', value: { mode: 'abc123' } },
      ],
      undriven: [],
      darkSpots: [],
      lints: [],
    });
  });
});
