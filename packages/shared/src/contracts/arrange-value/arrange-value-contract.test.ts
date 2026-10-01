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

    it('VALID: {a flat object} => parses each property value', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: { host: 'localhost' } }));

      expect(result).toStrictEqual({ host: 'localhost' });
    });

    it('VALID: {a nested object} => parses recursively, so { db: { host } } arranges as { db: { host: "localhost" } }', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: { db: { host: 'localhost' } } }));

      expect(result).toStrictEqual({ db: { host: 'localhost' } });
    });

    it('VALID: {three layers of object} => parses to the depth the shape declares', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: { db: { retry: { backoff: 'linear' } } } }));

      expect(result).toStrictEqual({ db: { retry: { backoff: 'linear' } } });
    });

    it('VALID: {an object holding an array} => the two composite arms nest through each other', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: { db: { ports: [7, 8] } } }));

      expect(result).toStrictEqual({ db: { ports: [7, 8] } });
    });

    it('EMPTY: {an object with no properties} => parses, since a shape can declare none', () => {
      const result = arrangeValueContract.parse(ArrangeValueStub({ value: {} }));

      expect(result).toStrictEqual({});
    });

    it('VALID: {null} => admits null, a value a nullable operand can take', () => {
      const result = arrangeValueContract.parse(null);

      expect(result).toBe(null);
    });
  });

  describe('invalid arrange values', () => {
    it('INVALID: {value: a Date} => throws, since an arrange value is scalar, array or object only', () => {
      expect(() => {
        return arrangeValueContract.parse(new Date(0));
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {a nested property holding a Date} => throws, since the recursion validates every depth', () => {
      expect(() => {
        return arrangeValueContract.parse({ db: { createdAt: new Date(0) } });
      }).toThrow(/Invalid input/u);
    });

    it('INVALID: {a property named ""} => throws, since a property key is a symbol name', () => {
      expect(() => {
        return arrangeValueContract.parse({ '': 7 });
      }).toThrow(/A property key of an arrange value is never empty\./u);
    });
  });
});
