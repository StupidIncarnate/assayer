import { ConditionLeafStub } from '@assayer/shared/contracts';

import { isObjectMemberLeafGuard } from './is-object-member-leaf-guard';

describe('isObjectMemberLeafGuard', () => {
  describe('an object-member read', () => {
    it("VALID: {config.mode with a type-ref} => true", () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      expect(isObjectMemberLeafGuard({ leaf })).toBe(true);
    });
  });

  describe('a scalar operand', () => {
    it('INVALID: {a plain param, no property path} => false', () => {
      const leaf = ConditionLeafStub({ operandParamName: 'score', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } });

      expect(isObjectMemberLeafGuard({ leaf })).toBe(false);
    });
  });

  describe('a nested object-member read', () => {
    it('INVALID: {config.user.role, path length 2} => false, only single-level reads qualify', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'config',
        operandPropertyPath: ['user', 'role'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'admin' },
      });

      expect(isObjectMemberLeafGuard({ leaf })).toBe(false);
    });
  });

  describe('a missing leaf', () => {
    it('EMPTY: {no leaf} => false', () => {
      expect(isObjectMemberLeafGuard({})).toBe(false);
    });
  });
});
