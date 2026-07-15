import { ConditionLeafStub, ConditionNodeStub } from '@assayer/shared/contracts';

import { conditionLeavesTransformer } from './condition-leaves-transformer';

const LEAF_A = ConditionLeafStub({ id: 'x#leaf.0', operandParamName: 'a' });
const LEAF_B = ConditionLeafStub({ id: 'x#leaf.1', operandParamName: 'b' });
const LEAF_C = ConditionLeafStub({ id: 'x#leaf.2', operandParamName: 'c' });

describe('conditionLeavesTransformer', () => {
  describe('flattening', () => {
    it('VALID: {a bare leaf} => that leaf alone', () => {
      expect(conditionLeavesTransformer({ condition: LEAF_A })).toStrictEqual([LEAF_A]);
    });

    it('VALID: {!a} => the negated leaf, since negation adds no operand of its own', () => {
      expect(
        conditionLeavesTransformer({ condition: ConditionNodeStub({ kind: 'not', operand: LEAF_A }) }),
      ).toStrictEqual([LEAF_A]);
    });

    it('VALID: {a && b} => both leaves, left before right', () => {
      expect(
        conditionLeavesTransformer({ condition: ConditionNodeStub({ kind: 'and', left: LEAF_A, right: LEAF_B }) }),
      ).toStrictEqual([LEAF_A, LEAF_B]);
    });

    it('VALID: {a && (b || c)} => all three leaves in EVALUATION order', () => {
      const condition = ConditionNodeStub({
        kind: 'and',
        left: LEAF_A,
        right: ConditionNodeStub({ kind: 'or', left: LEAF_B, right: LEAF_C }),
      });

      expect(conditionLeavesTransformer({ condition })).toStrictEqual([LEAF_A, LEAF_B, LEAF_C]);
    });
  });
});
