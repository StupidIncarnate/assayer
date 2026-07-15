/**
 * PURPOSE: Flattens a condition tree into its leaves, in evaluation order — the atoms anything that
 *   reasons per-operand needs (line enrichment today; probe placement and trace attribution later).
 *
 *   It exists so consumers never re-walk the tree themselves: one owner of "what are this condition's
 *   leaves" means enrichment and coverage can never disagree about how many there are.
 *
 * USAGE:
 * conditionLeavesTransformer({ condition: andTree });
 * // Returns [scoreLeaf, bonusLeaf] — left to right, as the language evaluates them
 */
import type { ConditionLeaf, ConditionNode } from '@assayer/shared/contracts';

export const conditionLeavesTransformer = ({ condition }: { condition: ConditionNode }): ConditionLeaf[] => {
  if (condition.kind === 'leaf') {
    return [condition];
  }

  if (condition.kind === 'not') {
    return conditionLeavesTransformer({ condition: condition.operand });
  }

  return [
    ...conditionLeavesTransformer({ condition: condition.left }),
    ...conditionLeavesTransformer({ condition: condition.right }),
  ];
};
