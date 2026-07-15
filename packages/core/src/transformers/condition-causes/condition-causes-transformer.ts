/**
 * PURPOSE: Enumerates the distinct CAUSES that make a condition tree come out a given way — each a
 *   set of leaf outcomes, in short-circuit order. This is what turns a compound condition into test
 *   cases: `score > 5 && bonus > 1` is false either because `score > 5` was false (and `bonus > 1`
 *   never ran) or because `score > 5` held and `bonus > 1` failed. Two reasons, two cases.
 *
 *   Short-circuiting is modelled, not approximated: a leaf the language would never evaluate simply
 *   does not appear in the cause. An absent leaf therefore means "never ran", which is exactly the
 *   distinction branch coverage throws away — and it is why enumeration stays LINEAR (`a && b && c`
 *   is false for 3 causes, true for 1: MC/DC's n+1) instead of exponential.
 *
 *   `!` is structure, not a predicate: it flips what its operand must be, so no predicate anywhere
 *   needs a negated twin and the type→range engine is untouched.
 *
 * USAGE:
 * conditionCausesTransformer({ condition: andTree, want: false });
 * // Returns [{ requirements: [{ leaf: scoreLeaf, want: false }] },
 * //          { requirements: [{ leaf: scoreLeaf, want: true }, { leaf: bonusLeaf, want: false }] }]
 */
import { conditionCauseContract } from '../../contracts/condition-cause/condition-cause-contract';
import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import type { ConditionNode } from '@assayer/shared/contracts';

export const conditionCausesTransformer = ({
  condition,
  want,
}: {
  condition: ConditionNode;
  want: boolean;
}): ConditionCause[] => {
  if (condition.kind === 'leaf') {
    return [conditionCauseContract.parse({ requirements: [{ leaf: condition, want }] })];
  }

  if (condition.kind === 'not') {
    return conditionCausesTransformer({ condition: condition.operand, want: !want });
  }

  // The DOMINANT outcome is the one the left operand can settle alone: `false` for `&&`, `true` for
  // `||`. Naming it collapses what would otherwise be four near-identical branches into two.
  const dominant = condition.kind === 'or';

  if (want === dominant) {
    return [
      // Left alone decides — the right operand never evaluates, so it contributes no requirement.
      ...conditionCausesTransformer({ condition: condition.left, want: dominant }),
      ...conditionCausesTransformer({ condition: condition.left, want: !dominant }).flatMap((leftCause) =>
        conditionCausesTransformer({ condition: condition.right, want: dominant }).map((rightCause) =>
          conditionCauseContract.parse({
            requirements: [...leftCause.requirements, ...rightCause.requirements],
          }),
        ),
      ),
    ];
  }

  // Both operands must take the non-dominant outcome, so both always evaluate.
  return conditionCausesTransformer({ condition: condition.left, want: !dominant }).flatMap((leftCause) =>
    conditionCausesTransformer({ condition: condition.right, want: !dominant }).map((rightCause) =>
      conditionCauseContract.parse({
        requirements: [...leftCause.requirements, ...rightCause.requirements],
      }),
    ),
  );
};
