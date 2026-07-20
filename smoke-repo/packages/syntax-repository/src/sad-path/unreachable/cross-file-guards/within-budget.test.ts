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
  // the rung — the contradiction exists in no single file, so no single-file pass can find it.
  it('VALID: {return size > 100} => one entry, one exit, no branch', () => {
    expect(analysis.functions).toStrictEqual([
      expect.objectContaining({
        entry: expect.objectContaining({ name: 'withinBudget', access: { kind: 'named' } }),
        branches: [],
        exits: [expect.objectContaining({ kind: 'return', guardPath: [], line: 2 })],
        cases: [expect.objectContaining({ arrange: [{ kind: 'param', param: 'size', value: 7 }] })],
      }),
    ]);
  });
});
