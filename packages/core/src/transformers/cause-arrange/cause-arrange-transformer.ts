/**
 * PURPOSE: Turns one cause's leaf requirements into the arrange bindings that realize it — grouping
 *   requirements by operand, INTERSECTING each operand's value sets (so a switch default's N `else`
 *   steps on one discriminant collapse to the single uncovered member), then cartesian-producting
 *   across DISTINCT operands and filling any unconstrained param with its representative value.
 *
 *   Values come from the operand's type and predicate — never from executing the code (P4). A
 *   requirement whose operand is not a simple binding constrains nothing: it cannot be arranged, so
 *   its param falls back to representative fill rather than pretending to a value it cannot set.
 *   Likewise an empty intersection (a cause that is unsatisfiable, e.g. `a > 5 && a < 3`) drops to
 *   representative fill so the exit still yields a case rather than silently vanishing.
 *
 * USAGE:
 * causeArrangeTransformer({ requirements: cause.requirements, params });
 * // Returns [[{ param: 'score', value: 6 }, { param: 'bonus', value: 2 }], …] — one per combination
 */
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';
import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import type { DerivedTestCase, ParamDescriptor, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

export const causeArrangeTransformer = ({
  requirements,
  params,
}: {
  requirements: ConditionCause['requirements'];
  params: ParamDescriptor[];
}): DerivedTestCase['arrange'][] => {
  const intersectionByOperand = requirements.reduce<Map<SymbolName, RepresentativeValue[]>>((acc, requirement) => {
    const operand = requirement.leaf.operandParamName;

    if (operand === undefined) {
      return acc;
    }

    const armValues = typeToRangeTransformer({
      type: requirement.leaf.operandType,
      predicateKind: requirement.leaf.predicate.kind,
      ...(requirement.leaf.predicate.literal === undefined ? {} : { literal: requirement.leaf.predicate.literal }),
    });
    // `want` is the whole of negation: `!` never reaches the range engine, it just flips the side.
    const values = requirement.want ? armValues.satisfying : armValues.violating;
    const existing = acc.get(operand);

    return acc.set(operand, existing === undefined ? values : existing.filter((value) => values.includes(value)));
  }, new Map<SymbolName, RepresentativeValue[]>());

  const operandChoices = [...intersectionByOperand.entries()].flatMap(([operand, values]) =>
    values.length === 0 ? [] : [{ operand, values }],
  );

  const bindings = operandChoices.reduce<Map<SymbolName, RepresentativeValue>[]>(
    (combos, choice) =>
      combos.flatMap((combo) => choice.values.map((value) => new Map(combo).set(choice.operand, value))),
    [new Map<SymbolName, RepresentativeValue>()],
  );

  return bindings.map((bound) =>
    params.map((param) => {
      const existing = bound.get(param.name);

      return {
        param: param.name,
        value: existing === undefined ? representativeValueTransformer({ type: param.type }) : existing,
      };
    }),
  );
};
