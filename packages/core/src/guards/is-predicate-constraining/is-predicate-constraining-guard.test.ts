import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

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

    // 7 is also the number representative. The violating arm excludes it and names nothing else, so it
    // realizes the next representative, 8, instead of landing on the 7 it excludes.
    it('VALID: {value === 7 on a number, the literal equal to the representative} => true', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'value',
        operandType: { kind: 'number' },
        predicate: { kind: 'eq', literal: 7 },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it("VALID: {name !== 'abc123' on a string, the literal equal to the representative} => true", () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'name',
        operandType: { kind: 'string' },
        predicate: { kind: 'neq', literal: 'abc123' },
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

    it('VALID: {value on boolean | undefined} => true, the truthy arm realizes true and the falsy arm false', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'value',
        operandType: {
          kind: 'union',
          members: [
            { kind: 'unknown', text: 'undefined' },
            { kind: 'literal', value: false },
            { kind: 'literal', value: true },
          ],
        },
        predicate: { kind: 'truthy' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it('VALID: {xs.length !== 0 on an array} => true, each arm names a length', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'xs',
        operandType: { kind: 'array', element: { kind: 'number' } },
        predicate: { kind: 'length-neq', literal: 0 },
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

  describe('a typeof read narrowing a union of scalar members', () => {
    it("VALID: {typeof target === 'string' on string|number} => true, both arms realize a different member's point", () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'target',
        operandIsTypeof: true,
        operandType: { kind: 'union', members: [{ kind: 'string' }, { kind: 'number' }] },
        predicate: { kind: 'typeof-eq', literal: 'string' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });
  });

  describe('a typeof read narrowing a union with a non-scalar matching member', () => {
    // The `Plain` member has no scalar point, so the violating side falls back to the SAME
    // representative the satisfying side already used — this engine genuinely cannot tell the two
    // arms apart yet, so it must say so rather than claim it can.
    it("INVALID: {typeof target === 'string' on Plain|string} => false, the shape Assayer cannot select yet", () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'target',
        operandIsTypeof: true,
        operandType: {
          kind: 'union',
          members: [{ kind: 'object', typeName: 'Plain', properties: [{ name: 'label', type: { kind: 'string' } }] }, { kind: 'string' }],
        },
        predicate: { kind: 'typeof-eq', literal: 'string' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });
  });

  describe('a typeof read that is tautological for its type', () => {
    // Every value of a bare `string` type already carries the 'string' tag, so the comparison never
    // varies — a safe, conservative "no" rather than a false claim of steerability.
    it("INVALID: {typeof target === 'string' on a bare string} => false, the comparison never varies", () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'target',
        operandIsTypeof: true,
        operandType: { kind: 'string' },
        predicate: { kind: 'typeof-eq', literal: 'string' },
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
    it('INVALID: {report === null on a callable} => false, no value of a callable is null and no OTHER callable is nameable either', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'report',
        operandType: { kind: 'callable', text: '() => void' },
        predicate: { kind: 'eq', literal: null },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });

    it('INVALID: {report !== null on a callable} => false, the same pair of arms with the arms swapped', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'report',
        operandType: { kind: 'callable', text: '() => void' },
        predicate: { kind: 'neq', literal: null },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });
  });

  describe('a comparison with the global undefined', () => {
    it('VALID: {process.env.MODE === undefined, read in place} => true, since a case can leave MODE unset', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'process.env.MODE',
        operandEnvVarName: 'MODE',
        operandType: { kind: 'string' },
        predicate: { kind: 'undefined-eq' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it('VALID: {a guarded Number read !== undefined} => true, since the guard keeps an unset variable undefined', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'value',
        operandEnvVarName: 'VALUE',
        operandEnvSteps: [{ kind: 'guard' }, { kind: 'number' }],
        operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'number' }] },
        predicate: { kind: 'undefined-neq' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(true);
    });

    it('INVALID: {Number(process.env.VALUE) === undefined} => false, since Number never returns undefined', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'value',
        operandEnvVarName: 'VALUE',
        operandEnvSteps: [{ kind: 'number' }],
        operandType: { kind: 'number' },
        predicate: { kind: 'undefined-eq' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });

    it('INVALID: {a parameter === undefined} => false, since no arranged value is undefined', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'v',
        operandType: { kind: 'union', members: [{ kind: 'unknown', text: 'undefined' }, { kind: 'string' }] },
        predicate: { kind: 'undefined-eq' },
      });

      expect(isPredicateConstrainingGuard({ leaf })).toBe(false);
    });
  });
});
