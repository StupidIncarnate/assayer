import { coverageIdContract } from './coverage-id-contract';
import { CoverageIdStub } from './coverage-id.stub';

describe('coverageIdContract', () => {
  describe('valid coverage ids', () => {
    it('VALID: {value: "formatGreeting/if:name.length===0"} => parses successfully', () => {
      const id = CoverageIdStub({ value: 'formatGreeting/if:name.length===0' });

      const result = coverageIdContract.parse(id);

      expect(result).toBe('formatGreeting/if:name.length===0');
    });
  });

  describe('invalid coverage ids', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return coverageIdContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
