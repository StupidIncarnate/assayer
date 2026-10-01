import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

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
    it('VALID: {config.user.role, path length 2} => true, a deeper read is the same shape of leaf', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'config',
        operandPropertyPath: ['user', 'role'],
        operandTypeRef: 'Config',
        operandType: { kind: 'unknown', text: 'any' },
        predicate: { kind: 'eq', literal: 'admin' },
      });

      expect(isObjectMemberLeafGuard({ leaf })).toBe(true);
    });

    it('VALID: {config.db.retry.backoff, path length 3} => true, any depth qualifies', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'config',
        operandPropertyPath: ['db', 'retry', 'backoff'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'x' },
      });

      expect(isObjectMemberLeafGuard({ leaf })).toBe(true);
    });
  });

  describe('a missing leaf', () => {
    it('EMPTY: {no leaf} => false', () => {
      expect(isObjectMemberLeafGuard({})).toBe(false);
    });
  });
});
