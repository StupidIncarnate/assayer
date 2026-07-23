/**
 * PURPOSE: Answers whether a condition leaf is an OBJECT-MEMBER read — a single-level `config.<prop>`
 *   whose root is a param and whose root carries a type-reference. This is exactly the leaf shape
 *   `derive-cases` admits UNDRIVEN (an object param's property is not scalar-arrangeable per-file), so
 *   it is the leaf `stub-realize` picks up to drive from the merged stub view.
 *
 *   A NESTED read (`config.user.role`, path length > 1) names a sub-object property whose scalar demand
 *   needs the sub-type resolved — a later rung — so only single-level reads qualify here. A missing leaf
 *   qualifies as nothing.
 *
 * USAGE:
 * isObjectMemberLeafGuard({ leaf });
 * // Returns true for `config.mode`, false for a scalar operand, a call operand, or a nested read
 */
import type { ConditionLeaf } from '@assayer/shared/contracts';

export const isObjectMemberLeafGuard = ({ leaf }: { leaf?: ConditionLeaf }): boolean =>
  leaf?.operandParamName !== undefined &&
  leaf.operandTypeRef !== undefined &&
  leaf.operandPropertyPath !== undefined &&
  leaf.operandPropertyPath.length === 1;
