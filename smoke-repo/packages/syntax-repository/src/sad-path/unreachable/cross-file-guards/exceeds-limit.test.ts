import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'exceeds-limit.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/cross-file-guards/exceeds-limit.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

describe('unreachable / exceeds-limit — a predicate function, the shape a caller has to see through', () => {
  // Branchless: the comparison is the RETURNED EXPRESSION, not a guard, so the file owes one exit and
  // one case. That is the whole difficulty of the cross-file rung — the constraint `size > 50` is real
  // and statically visible, but it lives in an exit's expression rather than in any guard path, so a
  // caller cannot pick it up from the branch model alone.
  it('VALID: {return size > 50} => one entry, one exit, no branch', () => {
    expect(analysis.functions).toStrictEqual([
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'exceedsLimit', access: { kind: 'named' } }),
        branches: [],
        exits: [expect.objectContaining({ kind: 'return', guardPath: [], line: 2 })],
        cases: [expect.objectContaining({ arrange: [{ kind: 'param', param: 'size', value: 7 }] })],
      }),
    ]);
  });
});
