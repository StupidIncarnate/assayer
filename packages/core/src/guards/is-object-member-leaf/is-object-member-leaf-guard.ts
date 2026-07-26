/**
 * PURPOSE: Answers whether a condition leaf is an OBJECT-MEMBER read — a `config.<prop>` (or a deeper
 *   `config.<prop>.<prop>…`) whose root is a param and whose root carries a type-reference. This is
 *   exactly the leaf shape `derive-cases` admits UNDRIVEN (an object param's property is not
 *   scalar-arrangeable per-file), so it is the leaf `stub-realize` picks up to drive from the merged
 *   stub view, at whatever depth the read reaches: `arrange-object-properties` and
 *   `demands-for-properties` both recurse into a nested object property, so a path of any length is the
 *   same shape of leaf, not a different one. A missing leaf qualifies as nothing.
 *
 * USAGE:
 * isObjectMemberLeafGuard({ leaf });
 * // Returns true for `config.mode` and for `config.db.retry`, false for a scalar operand or a call operand
 */
import type { ConditionLeaf } from '@assayer/shared/contracts';

export const isObjectMemberLeafGuard = ({ leaf }: { leaf?: ConditionLeaf }): boolean =>
  leaf?.operandParamName !== undefined && leaf.operandTypeRef !== undefined && leaf.operandPropertyPath !== undefined;
