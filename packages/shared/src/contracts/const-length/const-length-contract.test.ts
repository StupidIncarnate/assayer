import { constLengthContract } from './const-length-contract';
import { ConstLengthStub } from './const-length.stub';

describe('constLengthContract', () => {
  describe('valid const lengths', () => {
    it('VALID: {value: 0} => parses successfully', () => {
      const result = constLengthContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 3} => parses successfully', () => {
      const result = constLengthContract.parse(3);

      expect(result).toBe(3);
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const length = ConstLengthStub();

      const result = constLengthContract.parse(length);

      expect(result).toBe(3);
    });
  });

  describe('invalid const lengths', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => {
        return constLengthContract.parse(-1);
      }).toThrow(/greater than or equal to 0/u);
    });

    it('INVALID: {value: 2.5} => throws validation error', () => {
      expect(() => {
        return constLengthContract.parse(2.5);
      }).toThrow(/integer/u);
    });
  });
});
