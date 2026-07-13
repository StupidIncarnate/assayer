import { predicateContract } from './predicate-contract';
import { PredicateStub } from './predicate.stub';

describe('predicateContract', () => {
  describe('valid predicates', () => {
    it('VALID: {kind: "length-eq-zero"} => parses without a literal', () => {
      const predicate = PredicateStub({ kind: 'length-eq-zero' });

      const result = predicateContract.parse(predicate);

      expect(result).toStrictEqual({ kind: 'length-eq-zero' });
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
