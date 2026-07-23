import { arrangeValueContract } from './arrange-value-contract';
import { ArrangeValueStub } from './arrange-value.stub';

describe('arrangeValueContract', () => {
  describe('valid arrange values', () => {
    it('VALID: {a scalar} => parses the scalar element', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: 7 }));

      expect(result).toBe(7);
    });

    it('VALID: {a flat array} => parses each scalar element', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: [7, 7] }));

      expect(result).toStrictEqual([7, 7]);
    });

    it('VALID: {a nested array} => parses recursively, so number[][] arranges as [[7]]', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: [[7]] }));

      expect(result).toStrictEqual([[7]]);
    });

    it('VALID: {null} => admits null, a value a nullable operand can take', () => {
      const result = arrangeValueContract.parse(null);

      expect(result).toBe(null);
    });
  });

  describe('invalid arrange values', () => {
    it('INVALID: {value: {}} => throws, since an arrange value is scalar or nested array only', () => {
      expect(() => {
        return arrangeValueContract.parse({});
      }).toThrow(/Invalid input/u);
    });
  });
});
