import { predictedOutputContract } from './predicted-output-contract';
import { PredictedOutputStub } from './predicted-output.stub';

describe('predictedOutputContract', () => {
  describe('valid keys', () => {
    it('VALID: {a plain exit id} => parses unchanged', () => {
      expect(predictedOutputContract.parse('*module*/f/return@top')).toBe('*module*/f/return@top');
    });

    it('VALID: {an exit id with a predicate suffix} => parses unchanged', () => {
      expect(predictedOutputContract.parse('*module*/f/return@top|pred:true')).toBe('*module*/f/return@top|pred:true');
    });

    it('VALID: {stub default} => parses unchanged', () => {
      expect(predictedOutputContract.parse(PredictedOutputStub())).toBe('*module*/f/return@top');
    });
  });

  describe('invalid keys', () => {
    it('INVALID: {empty string} => throws validation error', () => {
      expect(() => {
        return predictedOutputContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});
