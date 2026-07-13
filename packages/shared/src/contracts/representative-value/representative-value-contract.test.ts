import { representativeValueContract } from './representative-value-contract';
import { RepresentativeValueStub } from './representative-value.stub';

describe('representativeValueContract', () => {
  describe('valid representative values', () => {
    it('VALID: {value: ""} => parses the empty-string representative', () => {
      const value = RepresentativeValueStub({ value: '' });

      const result = representativeValueContract.parse(value);

      expect(result).toBe('');
    });

    it('VALID: {value: 0} => parses a numeric representative', () => {
      const value = RepresentativeValueStub({ value: 0 });

      const result = representativeValueContract.parse(value);

      expect(result).toBe(0);
    });

    it('VALID: {value: false} => parses a boolean representative', () => {
      const value = RepresentativeValueStub({ value: false });

      const result = representativeValueContract.parse(value);

      expect(result).toBe(false);
    });
  });

  describe('invalid representative values', () => {
    it('INVALID: {value: {}} => throws validation error', () => {
      expect(() => {
        return representativeValueContract.parse({});
      }).toThrow(/Invalid input/u);
    });
  });
});
