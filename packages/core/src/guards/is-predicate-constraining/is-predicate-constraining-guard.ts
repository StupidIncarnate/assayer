/**
 * PURPOSE: Answers whether a condition leaf's predicate NAMES A VALUE on either arm — the fact
 *   `derive-cases` needs to know a branch can be steered at all. It asks the same `type-to-range`
 *   engine the arrangement itself runs, so the answer cannot disagree with the values a case would
 *   later be built from.
 *
 *   A predicate that constrains NEITHER arm partitions nothing: an equality against a value the parse
 *   could not read as a literal (an enum member, an imported or computed constant, a property of
 *   another object) is `unrecognized`, and a truthiness read of a type with no scalar point names
 *   nothing either. Both arms then intersect to the same domain and arrange the same inputs, so the
 *   arm the case predicts is decided by nothing — which is a case that fails against correct code.
 *
 *   It is a fact about a predicate and a type, not a policy: whether the branch is DRIVEN is decided in
 *   exactly one place, the `derive-cases` steerability gate, which asks this alongside its operand
 *   question. A missing leaf constrains nothing.
 *
 * USAGE:
 * isPredicateConstrainingGuard({ leaf });
 * // Returns true for `m === 'a'`, false for `m === TARGET` or `if (someObject)`
 */
import type { ConditionLeaf } from '@assayer/shared/contracts';

import { typeToRangeTransformer } from '../../transformers/type-to-range/type-to-range-transformer';
import { isDomainUnconstrainedGuard } from '../is-domain-unconstrained/is-domain-unconstrained-guard';

export const isPredicateConstrainingGuard = ({ leaf }: { leaf?: ConditionLeaf }): boolean => {
  if (leaf === undefined) {
    return false;
  }

  const armValues = typeToRangeTransformer({
    type: leaf.operandType,
    predicateKind: leaf.predicate.kind,
    ...(leaf.predicate.literal === undefined ? {} : { literal: leaf.predicate.literal }),
  });

  return (
    !isDomainUnconstrainedGuard({ domain: armValues.satisfying }) ||
    !isDomainUnconstrainedGuard({ domain: armValues.violating })
  );
};
