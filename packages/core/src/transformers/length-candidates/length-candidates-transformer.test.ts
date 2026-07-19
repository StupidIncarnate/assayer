import { ValueDomainStub } from '../../contracts/value-domain/value-domain.stub';
import { lengthCandidatesTransformer } from './length-candidates-transformer';

describe('lengthCandidatesTransformer', () => {
  describe('domains that say nothing about length', () => {
    // `undefined` and `[]` mean opposite things, and conflating them is how an operand nobody
    // constrained would start looking impossible.
    it('EMPTY: {an open domain} => undefined, not an empty list', () => {
      const result = lengthCandidatesTransformer({ domain: ValueDomainStub() });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {value bounds only} => undefined, since the value axis says nothing about length', () => {
      const result = lengthCandidatesTransformer({ domain: ValueDomainStub({ min: 10, max: 100 }) });

      expect(result).toBe(undefined);
    });
  });

  describe('bounded lengths', () => {
    // Shortest first: every length in the window drives the same flow, and preferring the top would
    // turn `length <= 1000000` into a million-character argument.
    it('VALID: {2 <= length <= 5} => the shortest satisfying length', () => {
      const result = lengthCandidatesTransformer({ domain: ValueDomainStub({ lengthMin: 2, lengthMax: 5 }) });

      expect(result).toStrictEqual([2]);
    });

    it('VALID: {length > 0} => one, the shortest length past the exclusive bound', () => {
      const result = lengthCandidatesTransformer({
        domain: ValueDomainStub({ lengthMin: 0, lengthMinExclusive: true }),
      });

      expect(result).toStrictEqual([1]);
    });

    // No string is shorter than empty, so an unstated lower bound floors at zero rather than running
    // off into the negatives. It is also what closes `length < 1` into a window of exactly one length.
    it('VALID: {length < 1} => zero alone, floored at the empty string', () => {
      const result = lengthCandidatesTransformer({
        domain: ValueDomainStub({ lengthMax: 1, lengthMaxExclusive: true }),
      });

      expect(result).toStrictEqual([0]);
    });

    it('VALID: {length === 0} => zero alone', () => {
      const result = lengthCandidatesTransformer({ domain: ValueDomainStub({ lengthMin: 0, lengthMax: 0 }) });

      expect(result).toStrictEqual([0]);
    });
  });

  describe('lengths nothing can satisfy', () => {
    // THE integer property. `> 1` and `< 2` leave no length, because a length is a count — the same
    // bounds on the VALUE axis still overlap, and `is-domain-empty` keeps them apart deliberately.
    it('VALID: {length > 1 and length < 2} => nothing, since a length is a whole number', () => {
      const result = lengthCandidatesTransformer({
        domain: ValueDomainStub({
          lengthMin: 1,
          lengthMinExclusive: true,
          lengthMax: 2,
          lengthMaxExclusive: true,
        }),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {length < 1 and length > 1} => nothing, since the window is closed', () => {
      const result = lengthCandidatesTransformer({
        domain: ValueDomainStub({
          lengthMin: 1,
          lengthMinExclusive: true,
          lengthMax: 1,
          lengthMaxExclusive: true,
        }),
      });

      expect(result).toStrictEqual([]);
    });

    it('VALID: {the only permitted length is ruled out} => nothing', () => {
      const result = lengthCandidatesTransformer({
        domain: ValueDomainStub({ lengthMin: 3, lengthMax: 3, lengthExcluded: [3] }),
      });

      expect(result).toStrictEqual([]);
    });
  });

  describe('ruled-out lengths', () => {
    // The scan runs one length past the number of exclusions, which is exhaustive: among that many
    // consecutive lengths at most all but one can be excluded. So an open upper bound stays cheap
    // WITHOUT giving up the ability to prove emptiness.
    it('VALID: {length !== 0} => steps past the ruled-out length rather than giving up', () => {
      const result = lengthCandidatesTransformer({ domain: ValueDomainStub({ lengthExcluded: [0] }) });

      expect(result).toStrictEqual([1]);
    });

    it('VALID: {0 and 1 both ruled out} => the first length neither guard forbids', () => {
      const result = lengthCandidatesTransformer({ domain: ValueDomainStub({ lengthExcluded: [0, 1] }) });

      expect(result).toStrictEqual([2]);
    });
  });
});
