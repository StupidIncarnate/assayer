import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { fileWalkBroker as walkFileTransformer } from '@assayer/core/walk-file';

const relPath = 'src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts';
const source = readFileSync(join(__dirname, 'fallthrough-in-if.ts'), 'utf8');

describe('composition / fallthrough-in-if — an if arm ending in a switch that falls through', () => {
  // REGRESSION GUARD for a real soundness bug: "does this always exit" and "are this statement's
  // ways out already emitted" are different questions, and answering both with one predicate makes
  // an if-arm ending in a fall-through switch look like it escapes. The trailing `return` would
  // then be guarded by that if's `else` — recording a genuinely unconditional exit as reachable
  // only one way, and keying it under a wrong coverage ID.
  it('VALID: {trailing return after a fall-through arm} => is UNGUARDED, because it runs on both arms', () => {
    const result = analyzeExtractBroker({ source, relPath, absPath: join(__dirname, 'fallthrough-in-if.ts') });
    const guards = result.success ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.guardPath) : [];

    expect(guards).toStrictEqual([[]]);
  });

  // `value > 5` guards the switch, so the switch is MET only on the route that took its `then` arm. Three
  // routes reach the one trailing `return 1`: `value > 5` with `mode === 'a'`, `value > 5` with any other
  // mode, and `value <= 5`, where the switch is never reached and so contributes no arm. There is no
  // fourth route: no input takes the switch's arm while `value > 5` fails. Each route is the only one to
  // take one of the arms (`mode === 'a'`, the switch's other arm, `value > 5` failing), so all three are in
  // the fewest-runs set. That the branching converges on one exit is not a reason to collapse the routes.
  it('VALID: {two converging branches, one nested} => three routes on the one return, all in the fewest runs', () => {
    const analysis = analyzeFileBroker({ walked: walkFileTransformer({ source, relPath, absPath: join(__dirname, 'fallthrough-in-if.ts') }), relPath });
    const IF = '*module*/tally/if:BinaryExpression,id:value,GreaterThanToken,num:5';
    const SWITCH = '*module*/tally/switch:id:mode,EqualsEqualsEqualsToken,str:a';

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      {
        reachesPath: ['*module*/tally/return@top'],
        arrange: [{ kind: 'param', param: 'value', value: 6 }, { kind: 'param', param: 'mode', value: 'a' }],
        arms: [{ branchCoverageId: IF, arm: 'then' }, { branchCoverageId: SWITCH, arm: 'then' }],
        driven: true,
        fewestRuns: true,
      },
      {
        reachesPath: ['*module*/tally/return@top'],
        arrange: [{ kind: 'param', param: 'value', value: 6 }, { kind: 'param', param: 'mode', value: 'abc123' }],
        arms: [{ branchCoverageId: IF, arm: 'then' }, { branchCoverageId: SWITCH, arm: 'else' }],
        driven: true,
        fewestRuns: true,
      },
      {
        reachesPath: ['*module*/tally/return@top'],
        arrange: [{ kind: 'param', param: 'value', value: 5 }, { kind: 'param', param: 'mode', value: 'abc123' }],
        arms: [{ branchCoverageId: IF, arm: 'else' }],
        driven: true,
        fewestRuns: true,
      },
    ]);
  });
});
