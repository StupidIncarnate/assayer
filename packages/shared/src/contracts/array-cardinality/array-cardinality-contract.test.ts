import { arrayCardinalityContract } from './array-cardinality-contract';
import { ArrayCardinalityStub } from './array-cardinality.stub';

describe('arrayCardinalityContract', () => {
  describe('valid array cardinalities', () => {
    it('VALID: {value: "one"} => parses the single-element class', () => {
      const cardinality = ArrayCardinalityStub({ value: 'one' });

      const result = arrayCardinalityContract.parse(cardinality);

      expect(result).toBe('one');
    });

    it('VALID: {value: "empty"} => parses the empty class', () => {
      const result = arrayCardinalityContract.parse('empty');

      expect(result).toBe('empty');
    });

    it('VALID: {value: "many"} => parses the many class', () => {
      const result = arrayCardinalityContract.parse('many');

      expect(result).toBe('many');
    });
  });

  describe('invalid array cardinalities', () => {
    it('INVALID: {value: "two"} => throws validation error', () => {
      expect(() => {
        return arrayCardinalityContract.parse('two');
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});
