import { stringLengthContract } from './string-length-contract';
import { StringLengthStub } from './string-length.stub';

describe('stringLengthContract', () => {
  describe('valid lengths', () => {
    it('VALID: {stub default} => parses to the same value', () => {
      const length = StringLengthStub();

      const result = stringLengthContract.parse(length);

      expect(result).toStrictEqual(length);
    });

    // Empty is a length, and the one a `length === 0` guard realizes. Rejecting it would leave that
    // guard with nothing to arrange.
    it('EDGE: {0} => parses, since the empty string has a length', () => {
      const result = stringLengthContract.parse(0);

      expect(result).toBe(0);
    });
  });

  describe('invalid lengths', () => {
    it('INVALID: {-1} => throws validation error', () => {
      expect(() => {
        return stringLengthContract.parse(-1);
      }).toThrow(/greater than or equal to 0/u);
    });

    // A bound may be fractional because the source may compare against one; a realized length may not,
    // because no string is 1.5 characters long. That difference is the whole reason this type exists.
    it('INVALID: {1.5} => throws validation error', () => {
      expect(() => {
        return stringLengthContract.parse(1.5);
      }).toThrow(/integer/u);
    });
  });
});
