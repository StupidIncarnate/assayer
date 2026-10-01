import { coverageContract } from '@assayer/shared/contracts';

import { predictedOutputTransformer } from './predicted-output-transformer';

const EXIT = coverageContract.shape.id.parse('*module*/f/return@top');

describe('predictedOutputTransformer', () => {
  describe('branch-decided output', () => {
    it('VALID: {reachesPath only} => the joined path is the key', () => {
      expect(predictedOutputTransformer({ reachesPath: [EXIT] })).toBe('*module*/f/return@top');
    });
  });

  describe('branchless predicate output', () => {
    it('VALID: {reachesPath, predWant true} => the exit path split by the true return', () => {
      expect(predictedOutputTransformer({ reachesPath: [EXIT], predWant: true })).toBe('*module*/f/return@top|pred:true');
    });

    it('VALID: {reachesPath, predWant false} => the exit path split by the false return', () => {
      expect(predictedOutputTransformer({ reachesPath: [EXIT], predWant: false })).toBe('*module*/f/return@top|pred:false');
    });
  });
});
