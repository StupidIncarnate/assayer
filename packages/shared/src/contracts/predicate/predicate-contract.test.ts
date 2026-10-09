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

    it('VALID: {kind: "undefined-eq"} => parses without a literal', () => {
      const predicate = PredicateStub({ kind: 'undefined-eq' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'undefined-eq' });
    });

    it('VALID: {kind: "undefined-neq"} => parses without a literal', () => {
      const predicate = PredicateStub({ kind: 'undefined-neq' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'undefined-neq' });
    });

    // The runtime-tag axis: the literal is always the STRING tag `typeof` compared against.
    it('VALID: {kind: "typeof-eq", literal: "string"} => parses with the runtime-tag literal', () => {
      const predicate = PredicateStub({ kind: 'typeof-eq', literal: 'string' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'typeof-eq', literal: 'string' });
    });

    it('VALID: {kind: "typeof-neq", literal: "object"} => parses with the runtime-tag literal', () => {
      const predicate = PredicateStub({ kind: 'typeof-neq', literal: 'object' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'typeof-neq', literal: 'object' });
    });
  });

  describe('invalid predicates', () => {
    it('INVALID: {kind: "always"} => throws validation error', () => {
      expect(() => {
        return predicateContract.parse({ kind: 'always' });
      }).toThrow(/Invalid option: expected one of/u);
    });
  });
});
