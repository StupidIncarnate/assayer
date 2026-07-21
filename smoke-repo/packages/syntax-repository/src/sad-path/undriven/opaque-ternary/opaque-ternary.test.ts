import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'opaque-ternary.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/opaque-ternary/opaque-ternary.ts';

// The reason the analysis carries, verbatim. The ONLY thing that differs from opaque-if is the entry
// name — proving the undriven admission is the SAME uniform outcome whether the branch is an `if` or a
// ternary. That sameness is the point of this rung.
const BRANCH_REASON =
  '`opaqueTernary` has a branch on line 6 whose deciding value is neither one of its parameters nor an ' +
  'environment variable, so no case can steer which arm runs: with nothing to vary, both arms would ' +
  'arrange the same inputs and one would fail against correct code. Assayer understood the branch — ' +
  'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
  'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
  'becomes a case Assayer drives.';

describe('undriven / opaque-ternary — a ternary whose condition is a same-file call, nothing can steer', () => {
  // A ternary's condition is a branch exactly as an `if`'s is, so an opaque call in it is un-steerable
  // exactly the same way — same admission, same reason shape, one rung of the derivation, not two.
  it('VALID: {a ternary over an opaque same-file call} => the branch admitted undriven, named at its line', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([
      { name: 'opaqueTernary', reason: BRANCH_REASON, startLine: 6, endLine: 6 },
    ]);
  });

  it('VALID: {an un-steerable ternary} => no case is derived, since nothing can choose an arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
  });

  it('VALID: {a fully-understood ternary} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
