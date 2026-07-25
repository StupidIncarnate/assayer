import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';

import { isDomainUnconstrainedGuard } from './is-domain-unconstrained-guard';

describe('isDomainUnconstrainedGuard', () => {
  describe('a domain that names nothing', () => {
    // What `type-to-range` yields on BOTH arms of a truthy/falsy read of a type with no scalar point,
    // and on any predicate it could not read. Either way the operand takes the ordinary fill.
    it('VALID: {no members, no exclusions, no bounds, no length axis} => true', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({}) })).toBe(true);
    });

    // The exclusivity flags qualify a bound; an absent bound is not made present by them.
    it('VALID: {only the exclusivity flags set} => true', () => {
      expect(
        isDomainUnconstrainedGuard({
          domain: ValueDomainStub({ minExclusive: true, maxExclusive: true, lengthMinExclusive: true, lengthMaxExclusive: true }),
        }),
      ).toBe(true);
    });

    it('EMPTY: {no domain at all} => true', () => {
      expect(isDomainUnconstrainedGuard({})).toBe(true);
    });
  });

  describe('a domain that names a point', () => {
    it('VALID: {members: [a]} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ members: ['a'] }) })).toBe(false);
    });

    // An enumeration present-and-EMPTY is a constraint nothing satisfies, not an absent one.
    it('EMPTY: {members: []} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ members: [] }) })).toBe(false);
    });

    it('VALID: {excluded: [a]} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ excluded: ['a'] }) })).toBe(false);
    });

    it('VALID: {min: 5} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ min: 5 }) })).toBe(false);
    });

    it('VALID: {max: 5} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ max: 5 }) })).toBe(false);
    });

    // The length axis is the one `cfg.tags.length > 3` lands on, and the reason that property refuses.
    it('VALID: {lengthMin: 3} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ lengthMin: 3 }) })).toBe(false);
    });

    it('VALID: {lengthMax: 3} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ lengthMax: 3 }) })).toBe(false);
    });

    it('VALID: {lengthExcluded: [0]} => false', () => {
      expect(isDomainUnconstrainedGuard({ domain: ValueDomainStub({ lengthExcluded: [0] }) })).toBe(false);
    });
  });
});
