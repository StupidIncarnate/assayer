import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeExtractBroker } from '@assayer/core/extract-analysis';

const source = readFileSync(join(__dirname, 'fallthrough-in-if.ts'), 'utf8');

describe('composition / fallthrough-in-if — an if arm ending in a switch that falls through', () => {
  // REGRESSION GUARD for a real soundness bug: "does this always exit" and "are this statement's
  // ways out already emitted" are different questions, and answering both with one predicate makes
  // an if-arm ending in a fall-through switch look like it escapes. The trailing `return` would
  // then be guarded by that if's `else` — recording a genuinely unconditional exit as reachable
  // only one way, and keying it under a wrong coverage ID.
  it('VALID: {trailing return after a fall-through arm} => is UNGUARDED, because it runs on both arms', () => {
    const result = analyzeExtractBroker({ source, relPath: 'src/happy-path/composition/fallthrough-in-if/fallthrough-in-if.ts' });
    const guards = result.success ? result.functions.flatMap((fn) => fn.exits).map((exit) => exit.guardPath) : [];

    expect(guards).toStrictEqual([[]]);
  });
});
