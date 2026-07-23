import { coverageIdContract } from '@assayer/shared/contracts';

import { predictedOutputTransformer } from './predicted-output-transformer';

const EXIT = coverageIdContract.parse('*module*/f/return@top');

describe('predictedOutputTransformer', () => {
  describe('branch-decided output', () => {
    it('VALID: {reachesExit only} => the exit id is the key', () => {
      expect(predictedOutputTransformer({ reachesExit: EXIT })).toBe('*module*/f/return@top');
    });
  });

  describe('branchless predicate output', () => {
    it('VALID: {reachesExit, predWant true} => the exit id split by the true return', () => {
      expect(predictedOutputTransformer({ reachesExit: EXIT, predWant: true })).toBe('*module*/f/return@top|pred:true');
    });

    it('VALID: {reachesExit, predWant false} => the exit id split by the false return', () => {
      expect(predictedOutputTransformer({ reachesExit: EXIT, predWant: false })).toBe('*module*/f/return@top|pred:false');
    });
  });
});
