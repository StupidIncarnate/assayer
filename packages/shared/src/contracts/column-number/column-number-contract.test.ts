import { columnNumberContract } from './column-number-contract';
import { ColumnNumberStub } from './column-number.stub';

describe('columnNumberContract', () => {
  describe('valid column numbers', () => {
    it('VALID: {value: 1} => parses the first column', () => {
      const column = ColumnNumberStub({ value: 1 });

      const result = columnNumberContract.parse(column);

      expect(result).toBe(1);
    });

    it('VALID: {value: 26} => parses a later column', () => {
      const result = columnNumberContract.parse(26);

      expect(result).toBe(26);
    });
  });

  describe('invalid column numbers', () => {
    it('INVALID: {value: 0} => throws validation error', () => {
      expect(() => {
        return columnNumberContract.parse(0);
      }).toThrow(/greater than 0/u);
    });

    it('INVALID: {value: 1.5} => throws validation error', () => {
      expect(() => {
        return columnNumberContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
