import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'typeof-narrow.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/typeof-narrow/typeof-narrow.ts';

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`checkTypeof` has a branch on line 2 whose deciding value is a `typeof` read, so no case can steer ' +
  'which arm runs: with nothing to vary, both arms would arrange the same inputs and one would fail ' +
  'against correct code. Assayer understood the branch — this is not syntax it missed — but it does ' +
  'not decompose a `typeof` comparison into the case each result names; the value `typeof` narrows may ' +
  'already be a parameter this entry declares.';

describe('undriven / typeof-narrow — `typeof target === \'string\'`, a parameter Assayer cannot decompose', () => {
  // `target` IS one of the entry's own parameters — the operand `typeof` reads is not opaque the way a
  // call result is. What blocks the branch is that the leaf's own operand is the WHOLE `typeof`
  // expression, which the steerability gate cannot arrange into an input, never a missing parameter.
  it('VALID: {a typeof narrowing} => the branch admitted undriven, naming the typeof limit, never "make it a parameter"', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([{ name: 'checkTypeof', reason: BRANCH_REASON, startLine: 2, endLine: 2 }]);
  });

  // The defect this pins is the same class as `const-comparand`: a false RED. Before the cause split,
  // this branch printed "make the deciding value a parameter" — advice a reader cannot act on since
  // `target` already is one — and the reader had nowhere honest to go. No case is derived, so nothing
  // fails against correct code either way; only the WORDING moved.
  it('VALID: {a typeof-narrowed comparison} => no case is derived, so nothing fails against correct code', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
  });

  // NOT a dark spot: the walk read the `if`, both arms, and the `typeof` operand's own type (`string`,
  // the checker's type for the operator's result). Only the DECOMPOSITION is beyond it.
  it('VALID: {a fully-read if} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
