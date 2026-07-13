import { guardStepContract } from './guard-step-contract';
import { GuardStepStub } from './guard-step.stub';

describe('guardStepContract', () => {
  describe('valid guard steps', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const step = GuardStepStub();

      const result = guardStepContract.parse(step);

      expect(result).toStrictEqual(step);
    });
  });

  describe('invalid guard steps', () => {
    it('INVALID: {arm: ""} => throws validation error', () => {
      expect(() => {
        return guardStepContract.parse({
          branchCoverageId: 'formatGreeting/if:name.length===0',
          arm: '',
        });
      }).toThrow(/at least 1 character/u);
    });
  });
});
