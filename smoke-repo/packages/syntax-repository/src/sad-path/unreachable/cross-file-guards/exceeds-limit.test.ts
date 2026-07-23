import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'exceeds-limit.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/cross-file-guards/exceeds-limit.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

describe('unreachable / exceeds-limit — a predicate function, the shape a caller has to see through', () => {
  // Branchless: the comparison is the RETURNED EXPRESSION, not a guard, so the file owes one exit — but
  // TWO cases, one per side of `size > 50`. Both reach that one exit yet return different booleans, so
  // the predicate axis keeps them apart and both are salient. That is the whole difficulty of the
  // cross-file rung — the constraint `size > 50` is real and statically visible, but it lives in an
  // exit's expression rather than in any guard path, so a caller cannot pick it up from the branch
  // model alone.
  it('VALID: {return size > 50} => one entry, one exit, two salient cases (51 satisfies, 50 violates)', () => {
    expect(analysis.functions).toStrictEqual([
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'exceedsLimit', access: { kind: 'named' } }),
        branches: [],
        exits: [expect.objectContaining({ kind: 'return', guardPath: [], line: 2 })],
        cases: [
          { reachesExit: '*module*/exceedsLimit/return@top', arrange: [{ kind: 'param', param: 'size', value: 51 }], salient: true },
          { reachesExit: '*module*/exceedsLimit/return@top', arrange: [{ kind: 'param', param: 'size', value: 50 }], salient: true },
        ],
      }),
    ]);
  });
});
