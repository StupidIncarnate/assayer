import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'enum-case.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/enum-case/enum-case.ts';

const BRANCH_REASON =
  '`rank` has a branch on line 8 that compares `severity` against a value Assayer could not read as ' +
  'a literal — an enum member, an imported or computed constant, or a property of another object — ' +
  'so it has no value that satisfies the comparison and none that violates it: with nothing to vary, ' +
  'both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
  'understood the branch — this is not syntax it missed — but it cannot yet name the value on the ' +
  'other side of the comparison. Compare against a literal and each arm becomes a case Assayer drives.';

describe('undriven / enum-case — a `case` whose expression is an enum member, not a literal', () => {
  // The clause still becomes a BRANCH. Skipping it dropped its whole arm from the model: `return 1`
  // was never emitted, the `default` lost the else that guards it, and the one derived case predicted
  // the default while the run reached the skipped clause — reported as "reached no exit".
  it('VALID: {case Severity.Low} => a branch is emitted for the clause, never a dropped arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.branches.map((branch) => branch.kind))).toStrictEqual(['switch']);
  });

  it('VALID: {an enum-member case} => the branch admitted undriven, naming the comparison', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([{ name: 'rank', reason: BRANCH_REASON, startLine: 8, endLine: 8 }]);
  });

  it('VALID: {an unreadable case expression} => no case is derived, so nothing errors against correct code', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
  });
});
