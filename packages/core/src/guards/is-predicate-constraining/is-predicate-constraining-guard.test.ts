import { ConditionLeafStub } from '@assayer/shared/contracts';

import { isPredicateConstrainingGuard } from './is-predicate-constraining-guard';

describe('isPredicateConstrainingGuard', () => {
  describe('a comparison against a literal', () => {
    it("VALID: {m === 'a' on a string} => true", () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'm',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it('VALID: {score > 5 on a number} => true', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'score',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it('VALID: {s.length === 0 on a string} => true', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 's',
        operandType: { kind: 'string' },
        predicate: { kind: 'length-eq', literal: 0 },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });
  });

  describe('a truthiness read the type can realize', () => {
    it('VALID: {a boolean param} => true', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'flag',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });
  });

  describe('a comparison the parse could not read', () => {
    it('INVALID: {m === TARGET, an unrecognized predicate} => false', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'm',
        operandType: { kind: 'string' },
        predicate: { kind: 'unrecognized' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });
  });

  describe('a truthiness read of a type with no scalar point', () => {
    it('INVALID: {a callable param} => false, neither arm names a value', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'report',
        operandType: { kind: 'callable', text: '() => void' },
        predicate: { kind: 'truthy' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });
  });

  describe('a missing leaf', () => {
    it('EMPTY: {no leaf} => false', () => {
      expect(isPredicateConstrainingGuard({})).toBe(false);
    });
  });

  describe('an equality against null on a type with no scalar point', () => {
    it('VALID: {report === null on a callable} => true, the excluded-null violating arm alone names a value', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'report',
        operandType: { kind: 'callable', text: '() => void' },
        predicate: { kind: 'eq', literal: null },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it('VALID: {report !== null on a callable} => true, the excluded-null satisfying arm alone names a value', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'report',
        operandType: { kind: 'callable', text: '() => void' },
        predicate: { kind: 'neq', literal: null },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });
  });
});
