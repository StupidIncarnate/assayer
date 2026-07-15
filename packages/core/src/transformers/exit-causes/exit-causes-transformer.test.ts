import { BranchNodeStub, ConditionLeafStub, ConditionNodeStub, GuardStepStub } from '@assayer/shared/contracts';

import { exitCausesTransformer } from './exit-causes-transformer';

const LEAF_A = ConditionLeafStub({ id: 'A#leaf.0', operandParamName: 'a', predicate: { kind: 'gt', literal: 5 } });
const LEAF_B = ConditionLeafStub({ id: 'A#leaf.1', operandParamName: 'b', predicate: { kind: 'gt', literal: 1 } });
const LEAF_R = ConditionLeafStub({ id: 'R#leaf', operandParamName: 'ready', predicate: { kind: 'truthy' } });

const AND_BRANCH = BranchNodeStub({
  coverageId: 'A',
  condition: ConditionNodeStub({ kind: 'and', left: LEAF_A, right: LEAF_B }),
});
const READY_BRANCH = BranchNodeStub({ coverageId: 'R', condition: LEAF_R });

describe('exitCausesTransformer', () => {
  describe('an unguarded exit', () => {
    it('EMPTY: {no guard steps} => ONE empty cause, so the exit still yields a case', () => {
      expect(exitCausesTransformer({ branches: [AND_BRANCH], guardPath: [] })).toStrictEqual([{ requirements: [] }]);
    });
  });

  describe('a single guard step', () => {
    it("VALID: {arm 'then'} => the causes of the condition holding", () => {
      const causes = exitCausesTransformer({
        branches: [READY_BRANCH],
        guardPath: [GuardStepStub({ branchCoverageId: 'R', arm: 'then' })],
      });

      expect(causes).toStrictEqual([{ requirements: [{ leaf: LEAF_R, want: true }] }]);
    });

    it("VALID: {arm 'else'} => the causes of the condition FAILING", () => {
      const causes = exitCausesTransformer({
        branches: [READY_BRANCH],
        guardPath: [GuardStepStub({ branchCoverageId: 'R', arm: 'else' })],
      });

      expect(causes).toStrictEqual([{ requirements: [{ leaf: LEAF_R, want: false }] }]);
    });

    it("VALID: {compound condition, arm 'else'} => one cause per REASON the arm was taken", () => {
      const causes = exitCausesTransformer({
        branches: [AND_BRANCH],
        guardPath: [GuardStepStub({ branchCoverageId: 'A', arm: 'else' })],
      });

      expect(causes).toStrictEqual([
        { requirements: [{ leaf: LEAF_A, want: false }] },
        {
          requirements: [
            { leaf: LEAF_A, want: true },
            { leaf: LEAF_B, want: false },
          ],
        },
      ]);
    });
  });

  describe('a guard path of several steps', () => {
    it('VALID: {two steps, one satisfiable two ways} => the cartesian product, requirements merged', () => {
      const causes = exitCausesTransformer({
        branches: [AND_BRANCH, READY_BRANCH],
        guardPath: [
          GuardStepStub({ branchCoverageId: 'A', arm: 'else' }),
          GuardStepStub({ branchCoverageId: 'R', arm: 'then' }),
        ],
      });

      expect(causes).toStrictEqual([
        {
          requirements: [
            { leaf: LEAF_A, want: false },
            { leaf: LEAF_R, want: true },
          ],
        },
        {
          requirements: [
            { leaf: LEAF_A, want: true },
            { leaf: LEAF_B, want: false },
            { leaf: LEAF_R, want: true },
          ],
        },
      ]);
    });
  });

  describe('a guard step naming a branch that is not present', () => {
    it('EDGE: {unknown branch id} => the step contributes nothing rather than dropping the exit', () => {
      const causes = exitCausesTransformer({
        branches: [READY_BRANCH],
        guardPath: [GuardStepStub({ branchCoverageId: 'MISSING', arm: 'then' })],
      });

      expect(causes).toStrictEqual([{ requirements: [] }]);
    });
  });
});
