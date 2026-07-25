import { readFileSync } from 'fs';
import { join, resolve } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { stubRealizeBroker } from '@assayer/core/stub-realize';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'stub-sibling-array.ts'), 'utf8');
const relPath = 'src/happy-path/array/stub-sibling-array/stub-sibling-array.ts';
// The syntax-repository package root, so stub-realize resolves against the same layout a real run does.
const root = resolve(__dirname, '..', '..', '..', '..');

const GUARD =
  'if:BinaryExpression,PropertyAccessExpression,id:config,id:mode,EqualsEqualsEqualsToken,str:a';
const THEN = `*module*/merge/return@${GUARD}#then`;
const ELSE = `*module*/merge/return@${GUARD}#else`;

// The fill under test. `extra` is a `number[]` the case does not steer, and stub-realize routes it
// through the same `fill-param` seam every other derivation uses, so it is a REAL array.
const EXTRA_FILL = { kind: 'array', param: 'extra', value: [7] };

describe('array / stub-sibling-array — a sibling ARRAY param of a stub-realized entry is filled through the shared seam', () => {
  // Read this beside `array/sibling-fill`: an unsteered `number[]` gets the same real `[7]` whether it
  // sits beside a funnelled array param or beside a stub-realized OBJECT param, because both sites route
  // through `fill-param`. One fill authority is what makes those two answers the same.
  it('VALID: {an unsteered array sibling of a stub-realized object param} => a real one-element array', () => {
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

  // The object half, pinned separately: stub-realize resolves `Config`, arranges `mode` per arm, and
  // clears the per-file undriven admission. Two independent mechanisms meet in one entry — the object
  // param from the merged stub view, the array sibling from the fill seam — and this says which is which.
  it('VALID: {the object param beside it} => driven from its declared shape, nothing admitted', () => {
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
