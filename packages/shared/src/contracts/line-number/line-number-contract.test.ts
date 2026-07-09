import { lineNumberContract } from './line-number-contract';
import { LineNumberStub } from './line-number.stub';

describe('lineNumberContract', () => {
  describe('valid line numbers', () => {
    it('VALID: {value: 1} => parses successfully', () => {
      const result = lineNumberContract.parse(1);

      expect(result).toBe(1);
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const line = LineNumberStub();

      const result = lineNumberContract.parse(line);

      expect(result).toBe(1);
    });
  });

  describe('invalid line numbers', () => {
    it('INVALID: {value: 0} => throws validation error', () => {
      expect(() => {
        return lineNumberContract.parse(0);
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws validation error', () => {
      expect(() => {
        return lineNumberContract.parse(1.5);
      }).toThrow(/Expected integer/u);
    });
  });
});
