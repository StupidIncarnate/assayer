import { readFileSync } from 'fs';
import { join } from 'path';

import { analyzeFileBroker } from '@assayer/core/analyze-file';
import { tsMorphWalkFileAdapter } from '@assayer/core/walk-file';

const source = readFileSync(join(__dirname, 'compatible-guards.ts'), 'utf8');
const relPath = 'src/happy-path/unreachable/compatible-guards/compatible-guards.ts';
const analysis = analyzeFileBroker({ walked: tsMorphWalkFileAdapter({ source, relPath }) });
const bucket = analysis.functions[0];

describe('unreachable / compatible-guards — the same shape as sequential-guards, with every exit reachable', () => {
  // The negative half of the rung, and the reason it is a specimen rather than a comment. `> 100` then
  // `> 10` is the ordinary descending-threshold ladder; all three exits are reachable (101 / 11 / 0).
  // A solver that reports this file has learned to flag correct code, which is worse than not shipping.
  it('VALID: {descending thresholds} => three exits, each one a value can actually reach', () => {
    expect(bucket.exits.map((exit) => ({ arms: exit.guardPath.map((step) => String(step.arm)), line: exit.line }))).toStrictEqual([
      { arms: ['then'], line: 3 },
      { arms: ['else', 'then'], line: 7 },
      { arms: ['else', 'else'], line: 10 },
    ]);
  });

  // THE PAYOFF, and it was a live defect rather than a missing feature. Reaching `'medium'` needs
  // `size <= 100 AND size > 10`, and every value on this list satisfies its own exit's WHOLE path:
  // 101 is large, 100 is medium, 10 is small. Sampling each predicate on its own produced 100 and 11
  // for the middle exit — no shared member — so it fell back to a fill of 0, which reaches `'small'`
  // and failed a case against code that is completely correct.
  it('VALID: {an exit behind two guards} => a value satisfying every guard on its path', () => {
    expect(bucket.cases.map((testCase) => testCase.arrange)).toStrictEqual([
      [{ kind: 'param', param: 'size', value: 101 }],
      [{ kind: 'param', param: 'size', value: 100 }],
      [{ kind: 'param', param: 'size', value: 10 }],
    ]);
  });

  // Nothing is wrong with this file, and every channel agrees — including the lint channel that names
  // dead exits. This is the assertion that fails first if the solver ever learns to report healthy
  // code, which is the failure mode worth catching here rather than in a consumer's repo.
  it('VALID: {correct code} => no dark spot, no admission, and NO unreachable-exit lint', () => {
    expect({ darkSpots: analysis.darkSpots, undriven: analysis.undriven, lints: analysis.lints }).toStrictEqual({
      darkSpots: [],
      undriven: [],
      lints: [],
    });
  });
});
