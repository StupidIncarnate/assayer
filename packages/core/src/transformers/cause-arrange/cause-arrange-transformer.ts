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
 *   An unconstrained ARRAY param is its own fan-out axis, the ArrangeValue[] twin of the operand
 *   cartesian: `array-arrange` builds a real array of each cardinality (empty/one/many) and they are
 *   cross-producted across array params, so an array's input breadth is spanned the way a union
 *   operand's members are. The scalar fill would hand the string placeholder to code that operates on
 *   an array (`items.pop()`), which throws; a real array runs. A branch never constrains an array param
 *   in v1 (no length guards), so every array param takes this fan-out.
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
import type { ArrangeValue, DerivedTestCase, EnvVarName, ParamDescriptor, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isDomainEmptyGuard } from '../../guards/is-domain-empty/is-domain-empty-guard';
import { arrayCardinalityStatics } from '../../statics/array-cardinality/array-cardinality-statics';
import { arrayArrangeTransformer } from '../array-arrange/array-arrange-transformer';
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
  // A WELDED operand is a single-value domain to start from — `{members:[7]}` for a scalar const,
  // `{lengthMin:3, lengthMax:3}` for an array const's length. The guard arm values below intersect onto
  // it, so `{7} ∩ (>5)` stays `{7}` (the arm is reachable) while `{7} ∩ (<=5)` is empty (unreachable).
  // It is not an input a case sets; the analyzer evaluates it, so no `env`/`param` binding carries it.
  const constSeed = requirements.reduce<Map<SymbolName, ValueDomain>>((acc, requirement) => {
    const operand = requirement.leaf.operandParamName;

    if (operand === undefined) {
      return acc;
    }

    if (requirement.leaf.operandConstValue !== undefined) {
      return acc.set(operand, valueDomainContract.parse({ members: [requirement.leaf.operandConstValue] }));
    }

    if (requirement.leaf.operandConstLength !== undefined) {
      const length = requirement.leaf.operandConstLength;
      return acc.set(operand, valueDomainContract.parse({ lengthMin: length, lengthMax: length }));
    }

    return acc;
  }, new Map<SymbolName, ValueDomain>());

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
  }, constSeed);

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

  // Each unconstrained array param is a fan-out axis over cardinality: `array-arrange` builds a real
  // array of each size class (empty/one/many), so the derived set spans an array's input breadth the
  // way a union operand's members do. A branch never constrains an array param (no length guards yet),
  // so every array param takes this fan-out. `one` leads so the ordinary non-empty array is salient.
  const arrayChoices = params.flatMap((param) => {
    const {type} = param;

    return type.kind === 'array'
      ? [
          {
            param: param.name,
            values: arrayCardinalityStatics.order.map((cardinality) =>
              arrayArrangeTransformer({ element: type.element, count: arrayCardinalityStatics.counts[cardinality] }),
            ),
          },
        ]
      : [];
  });

  // The cartesian across array params, the ArrangeValue[] twin of `bindings`. Seeded with one empty
  // combo, so a cause with no array param yields exactly one (empty) array combo and the arrangement
  // count is unchanged.
  const arrayCombos = arrayChoices.reduce<Map<SymbolName, ArrangeValue[]>[]>(
    (combos, choice) => combos.flatMap((combo) => choice.values.map((value) => new Map(combo).set(choice.param, value))),
    [new Map<SymbolName, ArrangeValue[]>()],
  );

  return {
    unreachable: false,
    arrangements: bindings.flatMap((bound) =>
      arrayCombos.map((arrayCombo) => [
        ...params.map((param) => {
          const arrayValue = arrayCombo.get(param.name);

          // An array param is filled from its cardinality combo — a real array of this case's size class,
          // never the scalar placeholder that would make a real array method (`items.pop()`) throw.
          if (arrayValue !== undefined) {
            return { kind: 'array' as const, param: param.name, value: arrayValue };
          }

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
    ),
  };
};
