import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'within-budget.ts'), 'utf8');
const relPath = 'src/sad-path/unreachable/cross-file-guards/within-budget.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });

describe('unreachable / within-budget — the second predicate function, whose threshold contradicts the first', () => {
  // Identical in shape to `exceeds-limit`, and correct on its own terms: nothing here is wrong until
  // `upload` calls it after already returning for everything over 50. That separation is the point of
  // the rung — the contradiction exists in no single file, so no single-file pass can find it. Its
  // branchless `size > 100` splits into two salient cases just as `exceeds-limit` does.
  it('VALID: {return size > 100} => one entry, one exit, two salient cases (101 satisfies, 100 violates)', () => {
    expect(analysis.functions).toStrictEqual([
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'withinBudget', access: { kind: 'named' } }),
        branches: [],
        exits: [expect.objectContaining({ kind: 'return', guardPath: [], line: 2 })],
        cases: [
          { reachesExit: '*module*/withinBudget/return@top', arrange: [{ kind: 'param', param: 'size', value: 101 }], salient: true },
          { reachesExit: '*module*/withinBudget/return@top', arrange: [{ kind: 'param', param: 'size', value: 100 }], salient: true },
        ],
      }),
    ]);
  });
});
