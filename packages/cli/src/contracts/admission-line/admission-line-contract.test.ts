import { admissionLineContract } from './admission-line-contract';
import { AdmissionLineStub } from './admission-line.stub';

describe('admissionLineContract', () => {
  describe('valid lines', () => {
    it('VALID: {value: "  GAP find — needs a harness"} => parses successfully', () => {
      const line = AdmissionLineStub({ value: '  GAP find — needs a harness' });

      const result = admissionLineContract.parse(line);

      expect(result).toBe('  GAP find — needs a harness');
    });
  });

  describe('invalid lines', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return admissionLineContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
