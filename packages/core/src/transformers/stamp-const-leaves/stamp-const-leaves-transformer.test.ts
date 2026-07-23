import { ConditionLeafStub, conditionLeafContract, representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';

import { stampConstLeavesTransformer } from './stamp-const-leaves-transformer';

const VALUE = symbolNameContract.parse('value');
const THREE = representativeValueContract.parse(3);

describe('stampConstLeavesTransformer', () => {
  describe('a scalar leaf whose operand a caller welds', () => {
    it('VALID: {leaf on `value`, welds value->3} => the leaf carries operandConstValue 3', () => {
      const leaf = ConditionLeafStub({ operandParamName: 'value' });

      const result = stampConstLeavesTransformer({ condition: leaf, welds: new Map([[VALUE, THREE]]) });

      expect(result).toStrictEqual({ ...leaf, operandConstValue: 3 });
    });
  });

  describe('a leaf whose operand is not welded', () => {
    it('EMPTY: {leaf on `value`, welds other->3} => the leaf is returned unchanged', () => {
      const leaf = ConditionLeafStub({ operandParamName: 'value' });

      const result = stampConstLeavesTransformer({ condition: leaf, welds: new Map([[symbolNameContract.parse('other'), THREE]]) });

      expect(result).toStrictEqual(leaf);
    });
  });

  describe('an object-member leaf whose root a caller welds', () => {
    it('VALID: {config.mode leaf, welds config} => unchanged, the property fact left for the stub stitch', () => {
      const leaf = ConditionLeafStub({
        operandParamName: 'config',
        operandPropertyPath: ['mode'],
        operandTypeRef: 'Config',
        operandType: { kind: 'string' },
        predicate: { kind: 'eq', literal: 'a' },
      });

      const result = stampConstLeavesTransformer({
        condition: leaf,
        welds: new Map([[symbolNameContract.parse('config'), representativeValueContract.parse('a')]]),
      });

      expect(result).toStrictEqual(leaf);
    });
  });

  describe('a leaf with no param operand', () => {
    it('EDGE: {an env-read leaf} => unchanged, since a welded argument pins only a param', () => {
      const leaf = conditionLeafContract.parse({
        kind: 'leaf',
        id: 'stub/if:BinaryExpression,env:MODE#leaf',
        operandEnvVarName: 'MODE',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 5 },
      });

      const result = stampConstLeavesTransformer({ condition: leaf, welds: new Map([[VALUE, THREE]]) });

      expect(result).toStrictEqual(leaf);
    });
  });

  describe('a compound condition', () => {
    it('VALID: {and-tree, only the left leaf welded} => the left is stamped and the right untouched', () => {
      const left = ConditionLeafStub({ id: 'stub/and#leaf.0', operandParamName: 'value' });
      const right = ConditionLeafStub({ id: 'stub/and#leaf.1', operandParamName: 'other' });

      const result = stampConstLeavesTransformer({ condition: { kind: 'and', left, right }, welds: new Map([[VALUE, THREE]]) });

      expect(result).toStrictEqual({ kind: 'and', left: { ...left, operandConstValue: 3 }, right });
    });

    it('VALID: {or-tree, only the right leaf welded} => the right is stamped and the left untouched', () => {
      const left = ConditionLeafStub({ id: 'stub/or#leaf.0', operandParamName: 'other' });
      const right = ConditionLeafStub({ id: 'stub/or#leaf.1', operandParamName: 'value' });

      const result = stampConstLeavesTransformer({ condition: { kind: 'or', left, right }, welds: new Map([[VALUE, THREE]]) });

      expect(result).toStrictEqual({ kind: 'or', left, right: { ...right, operandConstValue: 3 } });
    });

    it('VALID: {not-tree wrapping a welded leaf} => recurses and stamps the operand', () => {
      const leaf = ConditionLeafStub({ operandParamName: 'value' });

      const result = stampConstLeavesTransformer({ condition: { kind: 'not', operand: leaf }, welds: new Map([[VALUE, THREE]]) });

      expect(result).toStrictEqual({ kind: 'not', operand: { ...leaf, operandConstValue: 3 } });
    });
  });
});
