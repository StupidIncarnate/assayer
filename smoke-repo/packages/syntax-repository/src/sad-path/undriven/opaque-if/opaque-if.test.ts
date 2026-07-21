import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'opaque-if.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/opaque-if/opaque-if.ts';

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`opaqueIf` has a branch on line 6 whose deciding value is neither one of its parameters nor an ' +
  'environment variable, so no case can steer which arm runs: with nothing to vary, both arms would ' +
  'arrange the same inputs and one would fail against correct code. Assayer understood the branch — ' +
  'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
  'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
  'becomes a case Assayer drives.';

describe('undriven / opaque-if — an `if` whose deciding value is a same-file call, nothing can steer', () => {
  // `decide()` returns a boolean the file computes; nothing about the guard is a param or an env
  // operand, so no case can arrange which arm `opaqueIf` takes. The branch is admitted undriven at its
  // own line — NOT the whole-file span a welded module scope gets, because the owner is a named entry.
  it('VALID: {an `if` over an opaque same-file call} => the branch admitted undriven, named at its line', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.undriven).toStrictEqual([
      { name: 'opaqueIf', reason: BRANCH_REASON, startLine: 6, endLine: 6 },
    ]);
  });

  // WHY the admission is owed, stated as evidence: both arms would arrange the SAME (empty) inputs, so
  // the derivation emits NO case rather than two that misclaim their exits. That is what "undriven"
  // means here, and why a run reports 0/0 rather than failing a case against correct code.
  it('VALID: {an un-steerable guard} => no case is derived, since nothing can choose an arm', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([]);
  });

  // NOT a dark spot: the walk read this `if` and both arms perfectly. It is understood and simply
  // un-steerable — the two admissions are opposite claims and must never merge.
  it('VALID: {a fully-understood if} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
