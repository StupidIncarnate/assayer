import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { intersectDomainsTransformer } from './intersect-domains-transformer';

describe('intersectDomainsTransformer', () => {
  describe('numeric bounds', () => {
    // THE case the whole domain model exists for. `<= 100` and `> 10` are satisfied together by
    // anything in 11…100, but one sampled point per predicate lands on 100 and 11 — no shared member —
    // so sampling first reported nothing and derivation fell back to a fill reaching another exit.
    it('VALID: {<= 100, > 10} => the overlapping band, not an empty set', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ max: 100 }),
        right: ValueDomainStub({ min: 10, minExclusive: true }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ min: 10, minExclusive: true, max: 100 }));
    });

    it('VALID: {two lower bounds} => the tighter one survives', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ min: 10 }),
        right: ValueDomainStub({ min: 50 }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ min: 50 }));
    });

    // On a tie the EXCLUSIVE bound wins: `> 5` and `>= 5` together still rule 5 out. Taking either
    // side wholesale would silently re-admit the boundary point one of the guards excluded.
    it('EDGE: {> 5 and >= 5} => the same bound, kept exclusive', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ min: 5, minExclusive: true }),
        right: ValueDomainStub({ min: 5 }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ min: 5, minExclusive: true }));
    });

    it('VALID: {< 1 and > 1} => bounds that cross, left for is-domain-empty to judge', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ max: 1, maxExclusive: true }),
        right: ValueDomainStub({ min: 1, minExclusive: true }),
      });

      expect(result).toStrictEqual(
        ValueDomainStub({ min: 1, minExclusive: true, max: 1, maxExclusive: true }),
      );
    });
  });

  describe('length bounds', () => {
    // The length axis narrows by the same rule as the value axis and independently of it, which is
    // what lets `s.length >= 2 && s.length <= 5` end up as one window rather than two guards fighting.
    it('VALID: {length >= 2, length <= 5} => the overlapping length window', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ lengthMin: 2 }),
        right: ValueDomainStub({ lengthMax: 5 }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ lengthMin: 2, lengthMax: 5 }));
    });

    it('VALID: {length < 1, length > 1} => length bounds that cross, left for is-domain-empty to judge', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ lengthMax: 1, lengthMaxExclusive: true }),
        right: ValueDomainStub({ lengthMin: 1, lengthMinExclusive: true }),
      });

      expect(result).toStrictEqual(
        ValueDomainStub({ lengthMin: 1, lengthMinExclusive: true, lengthMax: 1, lengthMaxExclusive: true }),
      );
    });

    it('VALID: {two ruled-out lengths} => both are carried, deduped', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ lengthExcluded: [0] }),
        right: ValueDomainStub({ lengthExcluded: [0, 3] }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ lengthExcluded: [0, 3] }));
    });

    // The two axes are independent, and this is the assertion that says so. Folding a length bound into
    // `min`/`max` would claim the string itself is ordered against a number.
    it('EDGE: {a value bound and a length bound} => both survive on their own axis', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ min: 10 }),
        right: ValueDomainStub({ lengthMin: 2 }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ min: 10, lengthMin: 2 }));
    });
  });

  describe('enumerations', () => {
    it('VALID: {two enumerations} => only the members both allow', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ members: ['a', 'b', 'c'] }),
        right: ValueDomainStub({ members: ['b', 'c', 'd'] }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ members: ['b', 'c'] }));
    });

    // An ABSENT enumeration is OPEN, not empty. Treating it as empty would make every unenumerated
    // guard on a path annihilate the members another guard supplied.
    it('EDGE: {an enumeration and an open domain} => the enumeration survives intact', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ members: ['a', 'b'] }),
        right: ValueDomainStub(),
      });

      expect(result).toStrictEqual(ValueDomainStub({ members: ['a', 'b'] }));
    });

    it('EMPTY: {disjoint enumerations} => an enumeration nothing is left in', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ members: ['a'] }),
        right: ValueDomainStub({ members: ['b'] }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ members: [] }));
    });
  });

  describe('exclusions', () => {
    // Exclusions ACCUMULATE — a value has to dodge every point either side ruled out — and dedupe, so
    // folding the same guard twice cannot grow the list.
    it('VALID: {two exclusions} => both are carried, deduped', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ excluded: [0] }),
        right: ValueDomainStub({ excluded: [0, 5] }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ excluded: [0, 5] }));
    });

    it('VALID: {an exclusion and a bound} => both constraints survive together', () => {
      const result = intersectDomainsTransformer({
        left: ValueDomainStub({ excluded: [0] }),
        right: ValueDomainStub({ min: 5, minExclusive: true }),
      });

      expect(result).toStrictEqual(ValueDomainStub({ min: 5, minExclusive: true, excluded: [0] }));
    });
  });

  describe('open domains', () => {
    // Folding a guard path is one reduce over this, so intersecting with nothing has to be identity.
    it('EMPTY: {two open domains} => still open', () => {
      const result = intersectDomainsTransformer({ left: ValueDomainStub(), right: ValueDomainStub() });

      expect(result).toStrictEqual(ValueDomainStub());
    });
  });
});
