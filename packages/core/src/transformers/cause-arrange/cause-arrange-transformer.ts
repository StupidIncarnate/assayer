/**
 * PURPOSE: Turns one cause's leaf requirements into the arrange bindings that realize it — grouping
 *   requirements by operand, INTERSECTING each operand's value domain across every guard on the path,
 *   then cartesian-producting across DISTINCT operands and filling any unconstrained param with its
 *   representative value.
 *
 *   Values come from the operand's type and predicate — never from executing the code (P4). A
 *   requirement whose operand is not a simple binding constrains nothing: it cannot be arranged, so
 *   its param falls back to representative fill rather than pretending to a value it cannot set.
 *
 *   Intersecting DOMAINS rather than sampled values is what makes an exit behind several guards
 *   arrangeable at all. `size <= 100` and `size > 10` are satisfied together by anything in 11…100,
 *   but a point sampled per predicate lands on 100 and 11, which share no member — so sampling first
 *   reported no value and fell back to a fill that reaches a DIFFERENT exit, failing a case against
 *   correct code. The domain is narrowed first and the point chosen last.
 *
 *   An EMPTY intersection now means what it says: no value reaches this exit, and the caller is told
 *   so (`unreachable`) rather than handed a fill. The two were indistinguishable while values were
 *   sampled — an impossible path and a merely unlucky sample both produced no shared member — and
 *   conflating them is what turned a dead branch into a mystifying case failure.
 *
 *   An operand read from the ENVIRONMENT is arranged as a binding of its own, because it is set by a
 *   different act: a param is applied as an argument, while an environment variable is written before
 *   the module is imported. The value is `String(...)` of the point the domain engine picked — the
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
 * // Returns { unreachable: false, arrangements: [[{ kind: 'param', param: 'score', value: 6 }, …], …] }
 */
import { envValueContract } from '@assayer/shared/contracts';
import type { DerivedTestCase, EnvVarName, ParamDescriptor, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isDomainEmptyGuard } from '../../guards/is-domain-empty/is-domain-empty-guard';
import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { intersectDomainsTransformer } from '../intersect-domains/intersect-domains-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

export const causeArrangeTransformer = ({
  requirements,
  params,
  envDrivable,
}: {
  requirements: ConditionCause['requirements'];
  params: ParamDescriptor[];
  envDrivable: boolean;
}): { unreachable: boolean; arrangements: DerivedTestCase['arrange'][] } => {
  const domainByOperand = requirements.reduce<Map<SymbolName, ValueDomain>>((acc, requirement) => {
    const operand = requirement.leaf.operandParamName;

    if (operand === undefined) {
      return acc;
    }

    const armValues = typeToRangeTransformer({
      type: requirement.leaf.operandType,
      predicateKind: requirement.leaf.predicate.kind,
      ...(requirement.leaf.predicate.literal === undefined ? {} : { literal: requirement.leaf.predicate.literal }),
    });
    // `want` is the whole of negation: `!` never reaches the domain engine, it just flips the side.
    const domain = requirement.want ? armValues.satisfying : armValues.violating;
    const existing = acc.get(operand);

    return acc.set(operand, existing === undefined ? domain : intersectDomainsTransformer({ left: existing, right: domain }));
  }, new Map<SymbolName, ValueDomain>());

  // One operand nothing can satisfy is enough: the cause as a whole cannot happen, so there is no
  // arrangement to return and the exit behind it is unreachable through this cause.
  const unreachable = [...domainByOperand.values()].some((domain) => isDomainEmptyGuard({ domain }));

  if (unreachable) {
    return { unreachable: true, arrangements: [] };
  }

  // Which local bindings are environment reads, keyed by the same operand name the values above are.
  // Read off the leaves rather than passed in, because the leaf is where the walk recorded it.
  const envByOperand = envDrivable
    ? requirements.reduce<Map<SymbolName, EnvVarName>>((acc, requirement) => {
        const operand = requirement.leaf.operandParamName;
        const envVarName = requirement.leaf.operandEnvVarName;

        return operand === undefined || envVarName === undefined ? acc : acc.set(operand, envVarName);
      }, new Map<SymbolName, EnvVarName>())
    : new Map<SymbolName, EnvVarName>();

  const operandChoices = [...domainByOperand.entries()].flatMap(([operand, domain]) => {
    const values = domainValuesTransformer({ domain });

    return values.length === 0 ? [] : [{ operand, values }];
  });

  const bindings = operandChoices.reduce<Map<SymbolName, RepresentativeValue>[]>(
    (combos, choice) =>
      combos.flatMap((combo) => choice.values.map((value) => new Map(combo).set(choice.operand, value))),
    [new Map<SymbolName, RepresentativeValue>()],
  );

  return {
    unreachable: false,
    arrangements: bindings.map((bound) => [
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
    ]),
  };
};
