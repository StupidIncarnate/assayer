/**
 * PURPOSE: Works out which values a branch's whole condition took during one run case, from the
 * outcomes the case traced for each leaf. The trace records a leaf's own result, never the
 * condition's, so a `not`, `and` or `or` above the leaf decides which arm actually ran.
 *
 * A leaf with no traced outcome is unknown: either it never ran, or it carries no probe (the
 * non-nullish leaf of `??` has none). JavaScript only evaluates the right side of `&&` when the left
 * side is truthy, and the right side of `||` when the left side is falsy. So when the left side is
 * unknown but the right side ran, the right side's value is the whole connective's value.
 *
 * USAGE:
 * conditionOutcomesLayerTransformer({ condition, outcomesByLeafId });
 * // Returns the set of values the condition took. An empty set means the case cannot tell.
 */
import type { ConditionNode } from '@assayer/shared/contracts';

export const conditionOutcomesLayerTransformer = ({
  condition,
  outcomesByLeafId,
}: {
  condition: ConditionNode;
  outcomesByLeafId: ReadonlyMap<string, ReadonlySet<boolean>>;
}): ReadonlySet<boolean> => {
  if (condition.kind === 'leaf') {
    return outcomesByLeafId.get(condition.id) ?? new Set<boolean>();
  }
  if (condition.kind === 'not') {
    const operand = conditionOutcomesLayerTransformer({ condition: condition.operand, outcomesByLeafId });
    return new Set([...operand].map((outcome) => !outcome));
  }

  const left = conditionOutcomesLayerTransformer({ condition: condition.left, outcomesByLeafId });
  const right = conditionOutcomesLayerTransformer({ condition: condition.right, outcomesByLeafId });
  const shortCircuit = condition.kind === 'or';
  const values = new Set<boolean>();
  if (left.has(shortCircuit)) {
    values.add(shortCircuit);
  }
  if (left.has(!shortCircuit) || left.size === 0) {
    for (const outcome of right) {
      values.add(outcome);
    }
  }
  return values;
};
