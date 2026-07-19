import { predicateContract } from './predicate-contract';
import { PredicateStub } from './predicate.stub';

describe('predicateContract', () => {
  describe('valid predicates', () => {
    it('VALID: {kind: "truthy"} => parses without a literal', () => {
      const predicate = PredicateStub({ kind: 'truthy' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'truthy' });
    });

    // A length comparison carries its threshold like any other comparison — the zero case is not a
    // kind of its own, so `s.length === 0` and `s.length === 3` differ only in the literal.
    it('VALID: {kind: "length-gte", literal: 2} => parses with the length threshold', () => {
      const predicate = PredicateStub({ kind: 'length-gte', literal: 2 });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'length-gte', literal: 2 });
    });

    it('VALID: {kind: "eq", literal: "blocked"} => parses with a string literal', () => {
      const predicate = PredicateStub({ kind: 'eq', literal: 'blocked' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'eq', literal: 'blocked' });
    });
  });

  describe('invalid predicates', () => {
    it('INVALID: {kind: "always"} => throws validation error', () => {
      expect(() => {
        return predicateContract.parse({ kind: 'always' });
      }).toThrow(/Invalid enum value/u);
    });
  });
});
