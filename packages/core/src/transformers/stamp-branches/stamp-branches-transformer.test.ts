import { representativeValueContract } from '@assayer/shared/contracts';
import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { ConditionLeafStub } from '@assayer/shared/contracts/condition-leaf/condition-leaf.stub';

import { stampBranchesTransformer } from './stamp-branches-transformer';

const VALUE = 'value';
const THREE = representativeValueContract.parse(3);

describe('stampBranchesTransformer', () => {
  describe('a branch whose operand a caller welds', () => {
    it('VALID: {branch on `value`, welds value->3} => the branch condition carries operandConstValue 3', () => {
      const condition = ConditionLeafStub({ operandParamName: 'value' });
      const branch = BranchNodeStub({ condition });

      const result = stampBranchesTransformer({ branches: [branch], welds: new Map([[VALUE, THREE]]) });

      expect(result).toStrictEqual([{ ...branch, condition: { ...condition, operandConstValue: 3 } }]);
    });
  });

  describe('no welds', () => {
    it('EMPTY: {an empty weld map} => the branches are returned unchanged', () => {
      const branch = BranchNodeStub({ condition: ConditionLeafStub({ operandParamName: 'value' }) });

      const result = stampBranchesTransformer({ branches: [branch], welds: new Map() });

      expect(result).toStrictEqual([branch]);
    });
  });
});
