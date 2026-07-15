import { ConditionLeafStub, ConditionNodeStub } from '@assayer/shared/contracts';

import { conditionCausesTransformer } from './condition-causes-transformer';

const LEAF_A = ConditionLeafStub({ id: 'x#leaf.0', operandParamName: 'a', predicate: { kind: 'gt', literal: 5 } });
const LEAF_B = ConditionLeafStub({ id: 'x#leaf.1', operandParamName: 'b', predicate: { kind: 'gt', literal: 1 } });
const LEAF_C = ConditionLeafStub({ id: 'x#leaf.2', operandParamName: 'c', predicate: { kind: 'gt', literal: 2 } });

const AND_AB = ConditionNodeStub({ kind: 'and', left: LEAF_A, right: LEAF_B });
const OR_AB = ConditionNodeStub({ kind: 'or', left: LEAF_A, right: LEAF_B });

describe('conditionCausesTransformer', () => {
  describe('a leaf', () => {
    it('VALID: {leaf, want true} => one cause requiring the leaf to hold', () => {
      const causes = conditionCausesTransformer({ condition: LEAF_A, want: true });

      expect(causes).toStrictEqual([{ requirements: [{ leaf: LEAF_A, want: true }] }]);
    });

    it('VALID: {leaf, want false} => one cause requiring the leaf to fail', () => {
      const causes = conditionCausesTransformer({ condition: LEAF_A, want: false });

      expect(causes).toStrictEqual([{ requirements: [{ leaf: LEAF_A, want: false }] }]);
    });
  });

  describe('negation is structure, not a predicate', () => {
    it('VALID: {!a, want true} => the leaf must FAIL, with no negated predicate anywhere', () => {
      const causes = conditionCausesTransformer({
        condition: ConditionNodeStub({ kind: 'not', operand: LEAF_A }),
        want: true,
      });

      expect(causes).toStrictEqual([{ requirements: [{ leaf: LEAF_A, want: false }] }]);
    });

    it('VALID: {!a, want false} => the leaf must HOLD', () => {
      const causes = conditionCausesTransformer({
        condition: ConditionNodeStub({ kind: 'not', operand: LEAF_A }),
        want: false,
      });

      expect(causes).toStrictEqual([{ requirements: [{ leaf: LEAF_A, want: true }] }]);
    });
  });

  describe('conjunction', () => {
    it('VALID: {a && b, want true} => one cause, both leaves required to hold', () => {
      const causes = conditionCausesTransformer({ condition: AND_AB, want: true });

      expect(causes).toStrictEqual([
        {
          requirements: [
            { leaf: LEAF_A, want: true },
            { leaf: LEAF_B, want: true },
          ],
        },
      ]);
    });

    it('VALID: {a && b, want false} => two causes, and the short-circuited one OMITS b entirely', () => {
      const causes = conditionCausesTransformer({ condition: AND_AB, want: false });

      expect(causes).toStrictEqual([
        // b is absent, not false: when a fails the language never evaluates b. That distinction is
        // exactly what branch coverage cannot express.
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

  describe('disjunction', () => {
    it('VALID: {a || b, want true} => two causes, and the short-circuited one OMITS b entirely', () => {
      const causes = conditionCausesTransformer({ condition: OR_AB, want: true });

      expect(causes).toStrictEqual([
        { requirements: [{ leaf: LEAF_A, want: true }] },
        {
          requirements: [
            { leaf: LEAF_A, want: false },
            { leaf: LEAF_B, want: true },
          ],
        },
      ]);
    });

    it('VALID: {a || b, want false} => one cause, both leaves required to fail', () => {
      const causes = conditionCausesTransformer({ condition: OR_AB, want: false });

      expect(causes).toStrictEqual([
        {
          requirements: [
            { leaf: LEAF_A, want: false },
            { leaf: LEAF_B, want: false },
          ],
        },
      ]);
    });
  });

  describe('enumeration stays linear', () => {
    // The load-bearing property: short-circuiting means a chain of N leaves has N causes for the
    // dominant outcome and 1 for the other — MC/DC's n+1, NOT 2^n. If this ever grows exponentially,
    // exhaustive derivation stops being affordable.
    it('EDGE: {a && b && c, want false} => exactly THREE causes, not eight', () => {
      const causes = conditionCausesTransformer({
        condition: ConditionNodeStub({
          kind: 'and',
          left: ConditionNodeStub({ kind: 'and', left: LEAF_A, right: LEAF_B }),
          right: LEAF_C,
        }),
        want: false,
      });

      expect(causes).toStrictEqual([
        { requirements: [{ leaf: LEAF_A, want: false }] },
        {
          requirements: [
            { leaf: LEAF_A, want: true },
            { leaf: LEAF_B, want: false },
          ],
        },
        {
          requirements: [
            { leaf: LEAF_A, want: true },
            { leaf: LEAF_B, want: true },
            { leaf: LEAF_C, want: false },
          ],
        },
      ]);
    });

    it('EDGE: {a && b && c, want true} => exactly ONE cause requiring all three', () => {
      const causes = conditionCausesTransformer({
        condition: ConditionNodeStub({
          kind: 'and',
          left: ConditionNodeStub({ kind: 'and', left: LEAF_A, right: LEAF_B }),
          right: LEAF_C,
        }),
        want: true,
      });

      expect(causes).toStrictEqual([
        {
          requirements: [
            { leaf: LEAF_A, want: true },
            { leaf: LEAF_B, want: true },
            { leaf: LEAF_C, want: true },
          ],
        },
      ]);
    });
  });
});
