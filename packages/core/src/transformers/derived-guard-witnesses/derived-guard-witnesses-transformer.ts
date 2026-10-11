/**
 * PURPOSE: Keeps the arrangements that satisfy every guard over a FUNCTION of parameters
 *   (`trim(n) === 'x'`). Such a guard cannot narrow a domain, so it is settled on the values an
 *   arrangement picked: an arrangement that meets all of them is a witness that the route can run. An
 *   arrangement whose parameter values leave a guard unevaluable is not a witness.
 *
 * USAGE:
 * derivedGuardWitnessesTransformer({ derived, arrangements });
 * // Returns the arrangements on which every derived guard holds
 */
import type {
  ArrangeBinding,
  ConditionLeaf,
  RepresentativeValue,
  ValueExpr,
} from "@assayer/shared/contracts";

import { evaluateConstPredicateTransformer } from "../evaluate-const-predicate/evaluate-const-predicate-transformer";
import { valueExprEvaluateTransformer } from "../value-expr-evaluate/value-expr-evaluate-transformer";

export const derivedGuardWitnessesTransformer = ({
  derived,
  arrangements,
}: {
  derived: { leaf: ConditionLeaf; want: boolean; expr: ValueExpr }[];
  arrangements: ArrangeBinding[][];
}): ArrangeBinding[][] =>
  arrangements.filter((arrangement) => {
    const values = new Map<string, RepresentativeValue>(
      arrangement.flatMap((binding) =>
        binding.kind === "param"
          ? [[String(binding.param), binding.value] as const]
          : [],
      ),
    );

    return derived.every(({ leaf, want, expr }) => {
      const outcome = valueExprEvaluateTransformer({ expr, params: values });

      return (
        outcome !== undefined &&
        evaluateConstPredicateTransformer({
          value: outcome.value,
          predicateKind: leaf.predicate.kind,
          ...(leaf.predicate.literal === undefined
            ? {}
            : { literal: leaf.predicate.literal }),
        }) === want
      );
    });
  });
