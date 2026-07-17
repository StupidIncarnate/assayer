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
 *   An operand read from the ENVIRONMENT is arranged as a binding of its own, because it is set by a
 *   different act: a param is applied as an argument, while an environment variable is written before
 *   the module is imported. The value is `String(...)` of the point the range engine picked — the
 *   exact inverse of the `Number` coercion `read-env-operand` insists on, which is the whole reason
 *   that rung stops where it does. So the case says `VALUE="6"`, which is what a human would type to
 *   reproduce it, and `Number("6") > 5` decides the arm exactly as derivation claimed.
 *
 *   `envDrivable` is why the same fact does not become the same binding everywhere. Reading the
 *   environment is a fact about the CODE, so the leaf carries it wherever it is true; being DRIVEN by
 *   the environment is a fact about the entry, and only a module scope is — it is driven by importing
 *   it, which is when its top-level bindings read the environment. A function is driven by CALLING
 *   it, by which point its module has long since run and its captured `const` is frozen: setting the
 *   variable then changes nothing, so a case claiming it does would fail against correct code. Such
 *   an operand stays unconstrained here, exactly as it is today.
 *
 * USAGE:
 * causeArrangeTransformer({ requirements: cause.requirements, params, envDrivable: false });
 * // Returns [[{ kind: 'param', param: 'score', value: 6 }, …], …] — one per combination
 */
import { envValueContract } from '@assayer/shared/contracts';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';
import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import type { DerivedTestCase, EnvVarName, ParamDescriptor, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

export const causeArrangeTransformer = ({
  requirements,
  params,
  envDrivable,
}: {
  requirements: ConditionCause['requirements'];
  params: ParamDescriptor[];
  envDrivable: boolean;
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

  // Which local bindings are environment reads, keyed by the same operand name the values above are.
  // Read off the leaves rather than passed in, because the leaf is where the walk recorded it.
  const envByOperand = envDrivable
    ? requirements.reduce<Map<SymbolName, EnvVarName>>((acc, requirement) => {
        const operand = requirement.leaf.operandParamName;
        const envVarName = requirement.leaf.operandEnvVarName;

        return operand === undefined || envVarName === undefined ? acc : acc.set(operand, envVarName);
      }, new Map<SymbolName, EnvVarName>())
    : new Map<SymbolName, EnvVarName>();

  const operandChoices = [...intersectionByOperand.entries()].flatMap(([operand, values]) =>
    values.length === 0 ? [] : [{ operand, values }],
  );

  const bindings = operandChoices.reduce<Map<SymbolName, RepresentativeValue>[]>(
    (combos, choice) =>
      combos.flatMap((combo) => choice.values.map((value) => new Map(combo).set(choice.operand, value))),
    [new Map<SymbolName, RepresentativeValue>()],
  );

  return bindings.map((bound) => [
    ...params.map((param) => {
      const existing = bound.get(param.name);

      return {
        kind: 'param' as const,
        param: param.name,
        value: existing === undefined ? representativeValueTransformer({ type: param.type }) : existing,
      };
    }),
    // Only operands this cause actually CONSTRAINS get an environment binding. An unconstrained one
    // is a variable the flow never reads on this path, and writing it would claim a setup the case
    // does not depend on.
    ...[...envByOperand.entries()].flatMap(([operand, envVarName]) => {
      const value = bound.get(operand);

      return value === undefined
        ? []
        : [{ kind: 'env' as const, name: envVarName, value: envValueContract.parse(String(value)) }];
    }),
  ]);
};
