import { OrderedBoundsStub } from '../../contracts/ordered-bounds/ordered-bounds.stub';
import { intersectBoundsTransformer } from './intersect-bounds-transformer';

describe('intersectBoundsTransformer', () => {
  describe('bounds that overlap', () => {
    it('VALID: {<= 100, > 10} => the overlapping band', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ max: 100 }),
        right: OrderedBoundsStub({ min: 10, minExclusive: true }),
      });

      expect(result).toStrictEqual(OrderedBoundsStub({ min: 10, minExclusive: true, max: 100 }));
    });

    it('VALID: {two lower bounds} => the tighter one survives', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ min: 10 }),
        right: OrderedBoundsStub({ min: 50 }),
      });

      expect(result).toStrictEqual(OrderedBoundsStub({ min: 50 }));
    });

    it('VALID: {two upper bounds} => the tighter one survives', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ max: 10 }),
        right: OrderedBoundsStub({ max: 50 }),
      });

      expect(result).toStrictEqual(OrderedBoundsStub({ max: 10 }));
    });

    // THE rule this file exists to state once. Taking either side wholesale would silently re-admit
    // the boundary point one of the guards excluded, and it would do so on whichever axis forgot.
    it('EDGE: {> 5 and >= 5} => the same bound, kept exclusive', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ min: 5, minExclusive: true }),
        right: OrderedBoundsStub({ min: 5 }),
      });

      expect(result).toStrictEqual(OrderedBoundsStub({ min: 5, minExclusive: true }));
    });

    it('EDGE: {< 5 and <= 5} => the same bound, kept exclusive', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ max: 5, maxExclusive: true }),
        right: OrderedBoundsStub({ max: 5 }),
      });

      expect(result).toStrictEqual(OrderedBoundsStub({ max: 5, maxExclusive: true }));
    });
  });

  describe('bounds that cross', () => {
    // Crossed bounds are a legitimate RESULT, not an error. The caller reads emptiness off them, which
    // is what keeps this step associative enough to fold a whole guard path through.
    it('VALID: {< 1 and > 1} => bounds that cross, left for the caller to judge', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ max: 1, maxExclusive: true }),
        right: OrderedBoundsStub({ min: 1, minExclusive: true }),
      });

      expect(result).toStrictEqual(
        OrderedBoundsStub({ min: 1, minExclusive: true, max: 1, maxExclusive: true }),
      );
    });
  });

  describe('unbounded sides', () => {
    // Folding a guard path is one reduce over this, so intersecting with nothing has to be identity.
    it('EMPTY: {two unbounded pairs} => still unbounded', () => {
      const result = intersectBoundsTransformer({ left: OrderedBoundsStub(), right: OrderedBoundsStub() });

      expect(result).toStrictEqual(OrderedBoundsStub());
    });

    it('EDGE: {a bound and nothing} => the bound survives', () => {
      const result = intersectBoundsTransformer({
        left: OrderedBoundsStub({ min: 3 }),
        right: OrderedBoundsStub(),
      });

      expect(result).toStrictEqual(OrderedBoundsStub({ min: 3 }));
    });
  });
});
