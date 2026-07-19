import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { isDomainEmptyGuard } from './is-domain-empty-guard';

describe('isDomainEmptyGuard', () => {
  describe('bounds that cross', () => {
    it('VALID: {> 1 and <= 1} => empty', () => {
      const result = isDomainEmptyGuard({
        domain: ValueDomainStub({ min: 1, minExclusive: true, max: 1 }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {min above max} => empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ min: 100, max: 10 }) });

      expect(result).toBe(true);
    });

    // A shared inclusive bound is a single satisfiable point, not a contradiction. Reading `>= 5` and
    // `<= 5` as impossible would call an exit reached by exactly one value dead.
    it('EDGE: {>= 5 and <= 5} => NOT empty, since 5 satisfies both', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ min: 5, max: 5 }) });

      expect(result).toBe(false);
    });

    // Bounds are read over the REALS. Claiming nothing lies between 1 and 2 needs to know the operand
    // is an integer, and the type graph never says so.
    it('EDGE: {> 1 and < 2} => NOT empty, since bounds are not integers', () => {
      const result = isDomainEmptyGuard({
        domain: ValueDomainStub({ min: 1, minExclusive: true, max: 2, maxExclusive: true }),
      });

      expect(result).toBe(false);
    });
  });

  describe('length bounds that cross', () => {
    // THE reason the two axes are read over different number lines. A length is a count by the
    // language's own definition, so rounding its bounds inward is a fact — the identical pair of
    // bounds on the VALUE axis, three tests above, correctly stays non-empty.
    it('VALID: {length > 1 and length < 2} => empty, since a length is a whole number', () => {
      const result = isDomainEmptyGuard({
        domain: ValueDomainStub({
          lengthMin: 1,
          lengthMinExclusive: true,
          lengthMax: 2,
          lengthMaxExclusive: true,
        }),
      });

      expect(result).toBe(true);
    });

    it('VALID: {length < 1 and length > 1} => empty', () => {
      const result = isDomainEmptyGuard({
        domain: ValueDomainStub({
          lengthMin: 1,
          lengthMinExclusive: true,
          lengthMax: 1,
          lengthMaxExclusive: true,
        }),
      });

      expect(result).toBe(true);
    });

    // Overlapping length guards must NEVER be called impossible. This is the assertion that fails
    // first if the solver learns to report correct code, and it is the one worth having.
    it('EDGE: {2 <= length <= 5} => NOT empty, since a two-character string satisfies both', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ lengthMin: 2, lengthMax: 5 }) });

      expect(result).toBe(false);
    });

    it('EDGE: {length >= 2 alone} => NOT empty, since nothing bounds it from above', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ lengthMin: 2 }) });

      expect(result).toBe(false);
    });

    it('EDGE: {length !== 0} => NOT empty, since every longer string remains', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ lengthExcluded: [0] }) });

      expect(result).toBe(false);
    });

    it('VALID: {length === 3 and length !== 3} => empty, since the only permitted length is ruled out', () => {
      const result = isDomainEmptyGuard({
        domain: ValueDomainStub({ lengthMin: 3, lengthMax: 3, lengthExcluded: [3] }),
      });

      expect(result).toBe(true);
    });
  });

  describe('enumerations', () => {
    it('VALID: {an enumeration with nothing left in it} => empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ members: [] }) });

      expect(result).toBe(true);
    });

    it('VALID: {every member excluded} => empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ members: ['a'], excluded: ['a'] }) });

      expect(result).toBe(true);
    });

    it('VALID: {every member outside the bounds} => empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ members: [0], min: 5 }) });

      expect(result).toBe(true);
    });

    // A named value and a length bound constrain the same operand from two directions, so a member
    // whose length the axis forbids is genuinely gone.
    it('VALID: {every member the wrong length} => empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ members: ['a'], lengthMin: 5 }) });

      expect(result).toBe(true);
    });

    it('VALID: {one member survives} => not empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ members: ['a', 'b'], excluded: ['a'] }) });

      expect(result).toBe(false);
    });

    // Bounds say nothing about a string, so an unrelated numeric guard on the same operand must not
    // wipe out an enumeration of strings.
    it('EDGE: {string members under a numeric bound} => not empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ members: ['a'], min: 5 }) });

      expect(result).toBe(false);
    });
  });

  describe('domains that prove nothing', () => {
    // THE safety property. This predicate is what a build error is raised on, so anything the analyzer
    // merely could not read has to come back "not empty" — a false positive tells a reader to delete
    // correct code, which is worse than staying quiet.
    it('EMPTY: {an open domain} => not empty', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub() });

      expect(result).toBe(false);
    });

    it('EDGE: {an exclusion alone} => not empty, since everything else remains', () => {
      const result = isDomainEmptyGuard({ domain: ValueDomainStub({ excluded: [0] }) });

      expect(result).toBe(false);
    });

    it('EMPTY: {no domain at all} => not empty', () => {
      const result = isDomainEmptyGuard({});

      expect(result).toBe(false);
    });
  });
});
