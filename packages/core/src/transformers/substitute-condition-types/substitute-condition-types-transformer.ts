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
 *   A leaf reading an OBJECT-MEMBER (`operandPropertyPath` set, `config.mode` off an imported `Config`)
 *   is resolved a second way: its own `operandType` carries no reference of its own to look up (the
 *   property access's type reads as plain `any` in the hermetic walk, §5.10 — reading `config.mode`'s
 *   type needs `config`'s own shape, which this file does not have). Once the ROOT type-reference
 *   (`operandTypeRef`, the same name a plain-param leaf's own `typeRef` would carry) resolves,
 *   `resolve-property-type` walks the leaf's property path into that resolved shape, so `mode`'s real
 *   `string` type replaces the opaque `any` display — the SAME lookup `object-arrange` and
 *   `collect-property-demands` use to walk a property path into a declared type, reused here for
 *   DISPLAY rather than for a value. This changes only what the leaf's type reads as; the CASES a driven
 *   object-member branch produces come from `stub-realize`, unaffected by this substitution.
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

import { resolvePropertyTypeTransformer } from '../resolve-property-type/resolve-property-type-transformer';
import { substituteTypeRefsTransformer } from '../substitute-type-refs/substitute-type-refs-transformer';

export const substituteConditionTypesTransformer = ({
  condition,
  resolved,
}: {
  condition: ConditionNode;
  resolved: ReadonlyMap<string, TypeDescriptor>;
}): ConditionNode => {
  switch (condition.kind) {
    case 'leaf': {
      // An object-member leaf's own `operandType` names no reference `substitute-type-refs` could look
      // up (it reads as plain `any`), so its ROOT type-reference is resolved instead, and the leaf's
      // OWN property path is walked into that resolved shape. A root that never resolves, or a path
      // that does not land (a cross-file property nothing here can see, an unresolved sibling), leaves
      // `propertyResolved` `undefined`, and the leaf falls through to the SAME "unchanged when nothing
      // resolves" rule a plain leaf follows.
      const rootResolved = condition.operandTypeRef === undefined ? undefined : resolved.get(String(condition.operandTypeRef));
      const propertyResolved =
        rootResolved === undefined || condition.operandPropertyPath === undefined
          ? undefined
          : resolvePropertyTypeTransformer({ type: rootResolved, path: condition.operandPropertyPath });

      return conditionNodeContract.parse({
        ...condition,
        operandType: propertyResolved ?? substituteTypeRefsTransformer({ type: condition.operandType, resolved }),
      });
    }
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
