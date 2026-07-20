import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { domainValuesTransformer } from './domain-values-transformer';

describe('domainValuesTransformer', () => {
  describe('enumerations fan out', () => {
    // A union's `else` owes one case PER remaining member — that fan-out IS the tier-2 exhaustive
    // generation, so collapsing an enumeration to one value here would quietly delete it.
    it('VALID: {three members} => all three, so each earns its own case', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ members: ['a', 'b', 'c'] }) });

      expect(result).toStrictEqual(['a', 'b', 'c']);
    });

    it('VALID: {a member that is excluded} => only the survivors', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ members: ['a', 'b'], excluded: ['a'] }) });

      expect(result).toStrictEqual(['b']);
    });

    it('VALID: {a member outside the bounds} => only the survivors', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ members: [0, 20], min: 10 }) });

      expect(result).toStrictEqual([20]);
    });
  });

  describe('bounded domains yield one point', () => {
    // Every point inside a band drives the same flow, so a band owes exactly ONE case — unlike an
    // enumeration, where each member is a different flow.
    it('VALID: {10 < x <= 100} => one point satisfying both bounds', () => {
      const result = domainValuesTransformer({
        domain: ValueDomainStub({ min: 10, minExclusive: true, max: 100 }),
      });

      expect(result).toStrictEqual([100]);
    });

    // A lone `> 50` still arranges 51, the same value the boundary-sample engine picked, so unrelated
    // single-guard specimens do not churn.
    it('VALID: {x > 50} => the point just past the exclusive bound', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ min: 50, minExclusive: true }) });

      expect(result).toStrictEqual([51]);
    });

    it('VALID: {x <= 5} => the inclusive upper bound itself', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ max: 5 }) });

      expect(result).toStrictEqual([5]);
    });

    it('VALID: {x < 1} => the point just below the exclusive bound', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ max: 1, maxExclusive: true }) });

      expect(result).toStrictEqual([0]);
    });

    // A single ruled-out point must not strand an otherwise satisfiable band, so the neighbour is
    // offered after the preferred edge.
    it('EDGE: {x <= 5 with 5 excluded} => steps to the next point rather than giving up', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ max: 5, excluded: [5] }) });

      expect(result).toStrictEqual([4]);
    });
  });

  describe('length-bounded domains yield one string', () => {
    // THE payoff of keeping length as an axis. Two guards on one operand narrow the axis first and the
    // string is built last, so `>= 2 && <= 5` produces ONE value satisfying both — where realizing each
    // comparison as it was read would have produced two strings sharing no member.
    it('VALID: {2 <= length <= 5} => one string satisfying both length bounds', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ lengthMin: 2, lengthMax: 5 }) });

      expect(result).toStrictEqual(['ab']);
    });

    it('VALID: {length === 0} => the empty string', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ lengthMin: 0, lengthMax: 0 }) });

      expect(result).toStrictEqual(['']);
    });

    it('VALID: {length > 0} => the shortest non-empty string', () => {
      const result = domainValuesTransformer({
        domain: ValueDomainStub({ lengthMin: 0, lengthMinExclusive: true }),
      });

      expect(result).toStrictEqual(['a']);
    });

    it('VALID: {length !== 0} => a string of the first length the guard permits', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ lengthExcluded: [0] }) });

      expect(result).toStrictEqual(['a']);
    });

    // No length is left, so no string is offered. `is-domain-empty` is what turns that into a reported
    // dead exit — here it is simply nothing to arrange.
    it('EMPTY: {length < 1 and length > 1} => no values at all', () => {
      const result = domainValuesTransformer({
        domain: ValueDomainStub({
          lengthMin: 1,
          lengthMinExclusive: true,
          lengthMax: 1,
          lengthMaxExclusive: true,
        }),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {a member whose length the axis forbids} => only the survivors', () => {
      const result = domainValuesTransformer({
        domain: ValueDomainStub({ members: ['a', 'aaa'], lengthMin: 2 }),
      });

      expect(result).toStrictEqual(['aaa']);
    });
  });

  describe('domains that constrain nothing', () => {
    // EMPTY means "no constraint, fill it from the type" — never "unsatisfiable". `is-domain-empty`
    // owns that question, and the two demand opposite responses: fill a value, or report a dead exit.
    it('EMPTY: {an open domain} => no values, leaving the caller to fill from the type', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub() });

      expect(result).toStrictEqual([]);
    });

    it('EMPTY: {an exclusion with no bounds} => no values, since nothing states a point to pick', () => {
      const result = domainValuesTransformer({ domain: ValueDomainStub({ excluded: [0] }) });

      expect(result).toStrictEqual([]);
    });
  });
});
