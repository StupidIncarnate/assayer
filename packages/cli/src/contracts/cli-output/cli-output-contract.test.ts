import { cliOutputContract } from './cli-output-contract';
import { CliOutputStub } from './cli-output.stub';

describe('cliOutputContract', () => {
  describe('valid output', () => {
    it('VALID: {value: "assayer 1.0.0"} => parses successfully', () => {
      const output = CliOutputStub({ value: 'assayer 1.0.0' });

      const result = cliOutputContract.parse(output);

      expect(result).toBe('assayer 1.0.0');
    });
  });

  describe('invalid output', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return cliOutputContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
