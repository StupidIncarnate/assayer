/**
 * PURPOSE: Answers whether a condition leaf's predicate can be ARRANGED TO DIFFERENT VALUES on its two
 *   arms — the fact `derive-cases` needs to know a branch can be STEERED at all. Naming a value on ONE
 *   arm is not enough: a case predicting the OTHER arm still has to arrange something, and if that
 *   something is the same value the named arm already claimed — or nothing at all — the branch is not
 *   steerable, it only looks like it is. It asks the same engines `cause-arrange` realizes a value with,
 *   so the answer cannot disagree with the values a case is later built from.
 *
 *   A WELDED leaf (`operandConstValue`/`operandConstLength`) is EVALUATED against its known constant,
 *   never steered: `cause-arrange` intersects that constant directly with whichever arm a bucket wants,
 *   so "constraining" for it only asks whether the predicate is READABLE at all — does it narrow either
 *   side. The differing-values question below is for an operand a CASE has to set, which a welded one
 *   never is.
 *
 *   A type with no scalar point (an object, an array) still constrains a TRUTHY/FALSY/non-nullish read:
 *   every value the fill seam builds for it is truthy, so the truthy arm gets a real value and the
 *   falsy arm is a legitimate, nameable REFUSAL — `cause-arrange` realizes that refusal through
 *   `is-falsy-arm`, the same rule `object-arrange` already refuses a PROPERTY on. That is a genuine
 *   partition (one arm builds, one arm cannot), so it counts as constraining even though neither arm
 *   names a scalar point.
 *
 *   An ARRAY operand's `.length` predicate constrains on the LENGTH axis instead: an array has no scalar
 *   point, so the general realize path below never finds one, but a length bound is real breadth
 *   `cause-arrange`'s array fan-out can build from. Both arms must name a length for the predicate to
 *   partition them — `unrecognized` and a bare truthy/falsy read both leave the axis untouched on both
 *   sides, so this only fires for a genuine `.length` comparison.
 *
 *   A comparison with the global `undefined` constrains only an environment read that can hold
 *   `undefined` (`is-env-steps-nullable`), because the only input a case can make undefined is a
 *   variable it leaves unset. On a parameter it reads, and steers nothing.
 *
 *   Every other operand is realized the way `cause-arrange`'s own operand cartesian realizes it: the
 *   domain's own value where it names one (`domain-values`, UNFILTERED — `null` is a value the
 *   `non-nullish` violating arm names on purpose, per `representative-value-contract`, even though no
 *   `string`-typed candidate normally is one), falling back to the type's context-free representative
 *   only when the domain names NOTHING — exactly what an unconstrained operand receives downstream. The
 *   domain is realized with the operand's type, so an open domain that excludes the representative
 *   (`value === 7` on a number, whose violating arm excludes 7) realizes the next representative, 8,
 *   exactly as `cause-arrange` realizes it.
 *   Both arms must resolve to a value, and the two must DIFFER: a value on only one arm, or the same
 *   fallback landing on both (an unrecognized predicate, or a representative that happens to equal the
 *   excluded literal — `false` is BOTH the boolean representative and what `b === false` excludes on
 *   its violating arm), is not a partition a case can steer.
 *
 * USAGE:
 * isPredicateConstrainingGuard({ leaf });
 * // Returns true for `m === 'a'`, false for `m === TARGET` or `b === false` (before its type-to-range fix)
 */
import type { ConditionLeaf } from '@assayer/shared/contracts';

import { domainValuesTransformer } from '../../transformers/domain-values/domain-values-transformer';
import { lengthCandidatesTransformer } from '../../transformers/length-candidates/length-candidates-transformer';
import { representativeValueTransformer } from '../../transformers/representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../../transformers/type-to-range/type-to-range-transformer';
import { isDomainUnconstrainedGuard } from '../is-domain-unconstrained/is-domain-unconstrained-guard';
import { isEnvStepsNullableGuard } from '../is-env-steps-nullable/is-env-steps-nullable-guard';
import { isFalsyArmGuard } from '../is-falsy-arm/is-falsy-arm-guard';
import { isTypeFillableGuard } from '../is-type-fillable/is-type-fillable-guard';

export const isPredicateConstrainingGuard = ({ leaf }: { leaf?: ConditionLeaf }): boolean => {
  if (leaf === undefined) {
    return false;
  }

  const armValues = typeToRangeTransformer({
    type: leaf.operandType,
    predicateKind: leaf.predicate.kind,
    ...(leaf.predicate.literal === undefined ? {} : { literal: leaf.predicate.literal }),
  });

  if (leaf.operandConstValue !== undefined || leaf.operandConstLength !== undefined) {
    return (
      !isDomainUnconstrainedGuard({ domain: armValues.satisfying }) ||
      !isDomainUnconstrainedGuard({ domain: armValues.violating })
    );
  }

  // A comparison with `undefined` steers only an operand a case can actually make undefined: an
  // environment variable the case leaves unset, read through a chain that keeps `undefined`. Nothing
  // else a case arranges can be `undefined`, and the domain's `null` point would arrange `null`, which
  // `=== undefined` rejects.
  if (leaf.predicate.kind === 'undefined-eq' || leaf.predicate.kind === 'undefined-neq') {
    return leaf.operandEnvVarName !== undefined && isEnvStepsNullableGuard({ steps: leaf.operandEnvSteps ?? [] });
  }

  const isFalsyArmEligible =
    isFalsyArmGuard({ predicateKind: leaf.predicate.kind, want: true }) ||
    isFalsyArmGuard({ predicateKind: leaf.predicate.kind, want: false });

  if (
    isFalsyArmEligible &&
    isTypeFillableGuard({ type: leaf.operandType }) &&
    representativeValueTransformer({ type: leaf.operandType }) === undefined
  ) {
    return true;
  }

  if (leaf.operandType.kind === 'array') {
    return (
      lengthCandidatesTransformer({ domain: armValues.satisfying }) !== undefined &&
      lengthCandidatesTransformer({ domain: armValues.violating }) !== undefined
    );
  }

  const [satisfying, violating] = [armValues.satisfying, armValues.violating].map((domain) => {
    const [value] = domainValuesTransformer({ domain, type: leaf.operandType });

    return value === undefined ? representativeValueTransformer({ type: leaf.operandType }) : value;
  });

  return satisfying !== undefined && violating !== undefined && satisfying !== violating;
};
