import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'const-comparand.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/const-comparand/const-comparand.ts';

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`pick` has a branch on line 4 that compares `mode` against a value Assayer could not read as a ' +
  'literal — an enum member, an imported or computed constant, or a property of another object — so ' +
  'it has no value that satisfies the comparison and none that violates it: with nothing to vary, ' +
  'both arms would arrange the same inputs and one would fail against correct code. Assayer ' +
  'understood the branch — this is not syntax it missed — but it cannot yet name the value on the ' +
  'other side of the comparison. Compare against a literal and each arm becomes a case Assayer drives.';

describe('undriven / const-comparand — `mode === TARGET`, an operand a case CAN set and a comparison it cannot read', () => {
  // The operand is a parameter and perfectly arrangeable; what is missing is the value on the OTHER
  // side. Steerability asks both questions, so the branch is admitted at its own line rather than
  // deriving two cases that arrange the same `mode` and disagree about which arm it reaches.
  it('VALID: {a param compared against a same-file const} => the branch admitted undriven, naming the comparison', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'const-comparand.ts') }), relPath });

    expect(analysis.undriven).toStrictEqual([{ name: 'pick', reason: BRANCH_REASON, startLine: 4, endLine: 4 }]);
  });

  // The defect this pins is a FALSE RED: with the predicate constraining neither arm, both cases were
  // arranged `pick('abc123')` and whichever one predicted `#then` failed against correct code.
  it('VALID: {an unreadable comparison} => no case is derived, so nothing fails against correct code', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'const-comparand.ts') }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
  });

  // NOT a dark spot: the walk read the `if`, both arms, and the operand. Only the comparand is beyond
  // it, and the two admissions are opposite claims that must never merge.
  it('VALID: {a fully-read if} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'const-comparand.ts') }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
