/**
 * PURPOSE: Rewrites the OPERAND type of every leaf in one condition tree with the DECLARED type its
 *   reference names — the condition twin of `substitute-type-refs`, which does the same for a
 *   parameter. A branch on a parameter declared as an imported type reads its operand as `any` in the
 *   hermetic walk (§5.10), and the operand type is what the range engine enumerates from: leave it
 *   opaque and `level === 'low'` knows only "the point to avoid", so its else arm constrains nothing
 *   and gets filled with the very value the then arm demanded — a case predicting one exit while its
 *   input reaches the other. Resolved, `type Level = 'low' | 'high'` fans out to `'high'`, which is the
 *   tier-2 enumeration the union was always owed.
 *
 *   It recurses the `and`/`or`/`not` connectives so a compound condition's every leaf moves together,
 *   and it changes ONLY `operandType` — every id, predicate, property path and welded value is the walk's
 *   and stays exactly as read.
 *
 *   Pure and total: no ts-morph, no disk, no source text.
 *
 * USAGE:
 * substituteConditionTypesTransformer({ condition, resolved: new Map([['Level', { kind: 'union', members: [...] }]]) });
 * // Returns the same tree with each opaque leaf operand typed by its declaration
 */
import { conditionNodeContract } from '@assayer/shared/contracts';
import type { ConditionNode, TypeDescriptor } from '@assayer/shared/contracts';

import { substituteTypeRefsTransformer } from '../substitute-type-refs/substitute-type-refs-transformer';

export const substituteConditionTypesTransformer = ({
  condition,
  resolved,
}: {
  condition: ConditionNode;
  resolved: ReadonlyMap<string, TypeDescriptor>;
}): ConditionNode => {
  switch (condition.kind) {
    case 'leaf':
      return conditionNodeContract.parse({
        ...condition,
        operandType: substituteTypeRefsTransformer({ type: condition.operandType, resolved }),
      });
    case 'not':
      return conditionNodeContract.parse({
        kind: 'not',
        operand: substituteConditionTypesTransformer({ condition: condition.operand, resolved }),
      });
    case 'and':
    case 'or':
      return conditionNodeContract.parse({
        kind: condition.kind,
        left: substituteConditionTypesTransformer({ condition: condition.left, resolved }),
        right: substituteConditionTypesTransformer({ condition: condition.right, resolved }),
      });
    default:
      return condition;
  }
};
