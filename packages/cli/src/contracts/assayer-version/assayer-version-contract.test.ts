import { assayerVersionContract } from './assayer-version-contract';
import { AssayerVersionStub } from './assayer-version.stub';

describe('assayerVersionContract', () => {
  describe('valid version', () => {
    it('VALID: {value: "1.0.0"} => parses successfully', () => {
      const version = AssayerVersionStub({ value: '1.0.0' });

      const result = assayerVersionContract.parse(version);

      expect(result).toBe('1.0.0');
    });
  });

  describe('invalid version', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return assayerVersionContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
