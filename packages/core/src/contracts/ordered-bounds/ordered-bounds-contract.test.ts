import { orderedBoundsContract } from './ordered-bounds-contract';
import { OrderedBoundsStub } from './ordered-bounds.stub';

describe('orderedBoundsContract', () => {
  describe('valid bounds', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const bounds = OrderedBoundsStub();

      const result = orderedBoundsContract.parse(bounds);

      expect(result).toStrictEqual(bounds);
    });

    // Saying nothing must mean UNBOUNDED, not zero. A default of 0 would turn every unstated side into
    // a limit, and an open domain would start proving itself impossible.
    it('EMPTY: {no fields} => unbounded both ways, inclusive by default', () => {
      const result = orderedBoundsContract.parse({});

      expect(result).toStrictEqual({ minExclusive: false, maxExclusive: false });
    });

    it('VALID: {10 < x <= 100} => keeps both bounds and their exclusivity', () => {
      const result = orderedBoundsContract.parse({ min: 10, minExclusive: true, max: 100 });

      expect(result).toStrictEqual({ min: 10, minExclusive: true, max: 100, maxExclusive: false });
    });
  });

  describe('invalid bounds', () => {
    it('INVALID: {min: "10"} => throws validation error', () => {
      expect(() => {
        return orderedBoundsContract.parse({ min: '10' });
      }).toThrow(/Expected number, received string/u);
    });
  });
});
