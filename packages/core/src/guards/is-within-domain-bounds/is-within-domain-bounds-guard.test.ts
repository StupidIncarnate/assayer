import { representativeValueContract } from '@assayer/shared/contracts';

import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { isWithinDomainBoundsGuard } from './is-within-domain-bounds-guard';

describe('isWithinDomainBoundsGuard', () => {
  describe('a bounded domain', () => {
    it('VALID: {100 in 10 < x <= 100} => within', () => {
      const result = isWithinDomainBoundsGuard({
        value: representativeValueContract.parse(100),
        domain: ValueDomainStub({ min: 10, minExclusive: true, max: 100 }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {10 in 10 < x <= 100} => outside, since the lower bound is exclusive', () => {
      const result = isWithinDomainBoundsGuard({
        value: representativeValueContract.parse(10),
        domain: ValueDomainStub({ min: 10, minExclusive: true, max: 100 }),
      });

      expect(result).toBe(false);
    });

    it('EDGE: {10 in 10 <= x} => within, since the lower bound is inclusive', () => {
      const result = isWithinDomainBoundsGuard({
        value: representativeValueContract.parse(10),
        domain: ValueDomainStub({ min: 10 }),
      });

      expect(result).toBe(true);
    });
  });

  describe('values bounds cannot speak about', () => {
    // Bounds come from numeric comparisons, so they hold no opinion on a string. Reading "no opinion"
    // as "excluded" would drop every enumerated member as soon as an unrelated numeric guard shared
    // the operand.
    it('EDGE: {a string against a numeric bound} => within', () => {
      const result = isWithinDomainBoundsGuard({
        value: representativeValueContract.parse('a'),
        domain: ValueDomainStub({ min: 10 }),
      });

      expect(result).toBe(true);
    });

    it('EMPTY: {no domain} => within', () => {
      const result = isWithinDomainBoundsGuard({ value: representativeValueContract.parse(0) });

      expect(result).toBe(true);
    });

    it('EMPTY: {an open domain} => within', () => {
      const result = isWithinDomainBoundsGuard({
        value: representativeValueContract.parse(0),
        domain: ValueDomainStub(),
      });

      expect(result).toBe(true);
    });
  });
});
