import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'hof-callback.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/hof-callback/hof-callback.ts';

// The reason the analysis carries, verbatim. The callback `(x) => …` is passed to `apply`, so the code
// REACHES it — it is not dead surface, unlike a nested function nobody passes anywhere. But the value
// `x` binds to is whatever `apply` hands it (`cb(n)`), not an input any case at `run` controls, so no
// case can steer its `x > 5` branch. Distinct from an ARRAY-iteration callback, whose parameter is the
// element and IS steered by choosing the array (happy-path/array/map-conditional). The passthrough that
// would drive this — `run`'s own `value` reaching `x` through `apply` — is a later rung.
const CALLBACK_UNDRIVEN_REASON =
  'it is an inline callback this file reaches by passing it to a call, so it is not dead surface — but ' +
  'Assayer cannot yet steer the value its parameter binds to: that value is supplied by the function ' +
  'it is passed to, not by an input any case controls. No harness closes this. An array-iteration ' +
  'callback (`items.map((n) => …)`) IS driven instead, because its parameter is the array element, ' +
  'which a case steers by choosing the array the entry receives.';

describe('undriven / hof-callback — a branching callback passed to a same-file higher-order function', () => {
  // REACHED, so NOT a dead-surface lint (the callback would once have been mis-filed as one). It rides
  // the undriven channel — "Assayer cannot steer it", not "the repo should delete it".
  it('VALID: {a callback passed to apply} => admitted UNDRIVEN, naming why no case steers it', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.undriven.map((entry) => ({ reason: entry.reason, startLine: entry.startLine, endLine: entry.endLine }))).toStrictEqual([
      { reason: CALLBACK_UNDRIVEN_REASON, startLine: 6, endLine: 12 },
    ]);
  });

  // `apply` and the callback are not entries: `apply` is a branchless private, the callback is reached
  // only as an argument. Only the exported `run` is driven, with its one representative case. Nothing is
  // a dead-surface lint or a dark spot — the walk read every arm; it simply cannot steer the element.
  it('VALID: {a reached-but-unsteerable callback} => only run is driven; no lint, no dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      functions: analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases })),
      lints: analysis.lints,
      darkSpots: analysis.darkSpots,
    }).toStrictEqual({
      functions: [
        {
          name: 'run',
          access: { kind: 'named' },
          cases: [{ reachesPath: ['*module*/run/return@top'], arrange: [{ kind: 'param', param: 'value', value: 7 }], salient: true }],
        },
      ],
      lints: [],
      darkSpots: [],
    });
  });
});
