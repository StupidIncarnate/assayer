import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';
import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const relPath = 'src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts';
const source = readFileSync(join(__dirname, 'fallthrough-in-if.ts'), 'utf8');

describe('composition / fallthrough-in-if — an if arm ending in a switch that falls through', () => {
  // REGRESSION GUARD for a real soundness bug: "does this always exit" and "are this statement's
  // ways out already emitted" are different questions, and answering both with one predicate makes
  // an if-arm ending in a fall-through switch look like it escapes. The trailing `return` would
  // then be guarded by that if's `else` — recording a genuinely unconditional exit as reachable
  // only one way, and keying it under a wrong coverage ID.
  it('VALID: {trailing return after a fall-through arm} => is UNGUARDED, because it runs on both arms', () => {
    const result = analyzeExtractBroker({ source, relPath });
    const guards = result.success ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.guardPath) : [];

    expect(guards).toStrictEqual([[]]);
  });

  // The full input-bucket set is the CROSS PRODUCT of both branches' arms — `value > 5` (satisfied /
  // violated) times `mode === 'a'` (true / other) — so four buckets, ALL reaching the one trailing
  // `return 1`. Since every bucket returns the same value out of the same exit, exactly ONE is the
  // salient (must-run) representative and the other three are the grayed breadth. That the branching
  // converges on one exit is not a reason to collapse the four distinct inputs.
  it('VALID: {two converging branches} => four cases on the one return, exactly one salient', () => {
    const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }), relPath });

    expect(analysis.functions.flatMap((fn) => fn.cases)).toStrictEqual([
      { reachesExit: '*module*/tally/return@top', arrange: [{ kind: 'param', param: 'value', value: 6 }, { kind: 'param', param: 'mode', value: 'a' }], salient: true },
      { reachesExit: '*module*/tally/return@top', arrange: [{ kind: 'param', param: 'value', value: 6 }, { kind: 'param', param: 'mode', value: 'abc123' }], salient: false },
      { reachesExit: '*module*/tally/return@top', arrange: [{ kind: 'param', param: 'value', value: 5 }, { kind: 'param', param: 'mode', value: 'a' }], salient: false },
      { reachesExit: '*module*/tally/return@top', arrange: [{ kind: 'param', param: 'value', value: 5 }, { kind: 'param', param: 'mode', value: 'abc123' }], salient: false },
    ]);
  });
});
