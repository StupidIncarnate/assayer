import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'opaque-if.ts'), 'utf8');
const relPath = 'src/sad-path/undriven/opaque-if/opaque-if.ts';

// The reason the analysis carries, verbatim. Pinned HERE rather than left to the transformer's own
// unit test because that test authors the sentence it then asserts; this one reads what the analyzer
// actually said about a real file, which is the only way the two can disagree.
const BRANCH_REASON =
  '`opaqueIf` has a branch on line 6 whose deciding value is neither one of its parameters nor an ' +
  'environment variable, so no case can steer which arm runs: Assayer declares a route for each arm and does not run them. Assayer understood the branch — ' +
  'this is not syntax it missed — but its execution model cannot set the value that decides it. Make ' +
  'the deciding value a parameter, or read it from the environment in a module scope, and each arm ' +
  'becomes a case Assayer drives.';

describe('undriven / opaque-if — an `if` whose deciding value is a same-file call, nothing can steer', () => {
  // `decide()` returns a boolean the file computes; nothing about the guard is a param or an env
  // operand, so no case can arrange which arm `opaqueIf` takes. The branch is admitted undriven at its
  // own line — NOT the whole-file span a welded module scope gets, because the owner is a named entry.
  it('VALID: {an `if` over an opaque same-file call} => the branch admitted undriven, named at its line', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'opaque-if.ts') }), relPath });

    expect(analysis.undriven).toStrictEqual([
      { name: 'opaqueIf', reason: BRANCH_REASON, startLine: 6, endLine: 6 },
    ]);
  });

  // WHY the admission is owed, stated as evidence: both arms would arrange the SAME (empty) inputs, so no
  // input chooses between them. Each arm is still a route, so each is declared as a case, marked undriven
  // and never run: the case's arm label is the route it names, never an arm picked to stand in for the
  // other. That is why a run reports 0/0 rather than failing a case against correct code.
  it('VALID: {an un-steerable guard} => both routes are declared, undriven, and neither is in a run', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'opaque-if.ts') }) });

    expect(
      analysis.functions.flatMap((fn) => fn.cases).map((testCase) => ({
        reachesPath: testCase.reachesPath,
        arrange: testCase.arrange,
        arms: testCase.arms.map((step) => String(step.arm)),
        driven: testCase.driven,
      })),
    ).toStrictEqual([
      { reachesPath: ['*module*/opaqueIf/return@if:CallExpression,id:decide#then'], arrange: [], arms: ['then'], driven: false },
      { reachesPath: ['*module*/opaqueIf/return@if:CallExpression,id:decide#else'], arrange: [], arms: ['else'], driven: false },
    ]);
  });

  // NOT a dark spot: the walk read this `if` and both arms perfectly. It is understood and simply
  // un-steerable — the two admissions are opposite claims and must never merge.
  it('VALID: {a fully-understood if} => admits nothing as a dark spot', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'opaque-if.ts') }) });

    expect(analysis.darkSpots).toStrictEqual([]);
  });
});
