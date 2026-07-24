import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'returned-closure.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/returned-closure/returned-closure.ts';

// The reason the analysis carries, verbatim. `makeClassifier` RETURNS the arrow, so the code reaches it
// via the export surface — it is not dead surface, unlike a nested function nobody returns or calls.
// But its `n > threshold` turns on `n` (supplied by whoever later applies the returned function) and a
// closed-over `threshold`, neither an input a case at `makeClassifier` controls, so it is UNDRIVEN.
const REACHED_FN_REASON =
  'it is an inline function this file reaches without calling it by name — returned to a caller ' +
  '(`return (n) => …`), or invoked in place with an argument no case can resolve — so it is not dead ' +
  'surface. But no input any case controls decides the value its parameter binds to: a returned function ' +
  'is applied by whoever receives it, and an env-sourced or opaque invocation argument is not one this ' +
  'file provides. No harness closes this yet.';

describe('undriven / returned-closure — a function that RETURNS a branching closure', () => {
  // REACHED via the return, so NOT a dead-surface lint. It rides the undriven channel — "Assayer cannot
  // steer it", not "the repo should delete it".
  it('VALID: {makeClassifier returns (n) => { if (n > threshold) … }} => the returned closure is admitted UNDRIVEN', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    // The closure is anonymous, so its `name` is a structural projection — a cache key. The admission
    // therefore carries a display `label` naming the return that hands it out, and that is what both the
    // CLI's UNDRIVEN line and the desktop panel print.
    expect(
      analysis.undriven.map((entry) => ({ label: entry.label, reason: entry.reason, startLine: entry.startLine, endLine: entry.endLine })),
    ).toStrictEqual([{ label: 'makeClassifier › return (n) => … L2', reason: REACHED_FN_REASON, startLine: 2, endLine: 8 }]);
  });

  // `makeClassifier` is the sole driven entry — branchless (its `if` belongs to the returned closure, a
  // separate scope), one representative case. Nothing is a lint or a dark spot. (Its return type reads as
  // an empty object because function types are not modeled yet — a separate display gap, not this rung.)
  it('VALID: {a returned closure} => makeClassifier is the sole driven entry; no lint, no dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect({
      functions: analysis.functions.map((fn) => ({ name: fn.entry.name, access: fn.entry.access, cases: fn.cases })),
      lints: analysis.lints,
      darkSpots: analysis.darkSpots,
    }).toStrictEqual({
      functions: [
        {
          name: 'makeClassifier',
          access: { kind: 'named' },
          cases: [
            {
              reachesPath: ['*module*/makeClassifier/return@top'],
              arrange: [{ kind: 'param', param: 'threshold', value: 7 }],
              salient: true,
            },
          ],
        },
      ],
      lints: [],
      darkSpots: [],
    });
  });
});
