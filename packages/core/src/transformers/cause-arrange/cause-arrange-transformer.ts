/**
 * PURPOSE: Turns one cause's leaf requirements into the arrange bindings that realize it — grouping
 *   requirements by operand, INTERSECTING each operand's value domain across every guard on the path,
 *   then cartesian-producting across DISTINCT operands and filling any unconstrained param through the
 *   shared fill seam.
 *
 *   Values come from the operand's type and predicate — never from executing the code (P4). A
 *   requirement whose operand is not a simple binding constrains nothing: it cannot be arranged, so
 *   its param falls back to the seam's fill rather than pretending to a value it cannot set.
 *
 *   A param the seam REFUSES (`fill-param` — a callback, an opaque `Map<string, number>`, an object
 *   with a callable member) makes the whole cause unarrangeable: it returns NO arrangements and names
 *   the refusing params in `unfillable`. That is deliberately NOT `unreachable`, which says the guards
 *   contradict and marks the exit dead — nothing here is dead, the input is simply one Assayer cannot
 *   construct, and merging the two would report correct code as an unreachable-exit lint.
 *
 *   `harness` names the parameters a colocated harness SUPPLIES, and they skip the seam entirely: the
 *   binding carries the key path into the declaration instead of a value, because the value is a live
 *   callback the run reads and no derivation can build. It is checked before the fill and before the
 *   array fan-out, so a supplied parameter is neither refused nor spanned over cardinalities — one
 *   argument was handed over, and there is no breadth in it to enumerate.
 *
 *   An ARRAY param is its own fan-out axis, the ArrangeValue[] twin of the operand cartesian:
 *   `array-arrange` builds a real array of each cardinality (empty/one/many) and they are
 *   cross-producted across array params, so an array's input breadth is spanned the way a union
 *   operand's members are. The seam's own fill is one array at the `one` cardinality, which is a VALUE
 *   rather than a breadth, so the fan-out overrides it here — UNLESS this bucket's own `.length` guard
 *   already narrowed `domainByOperand` for this param, in which case the fan-out HONOURS that domain
 *   instead of overriding it: it realizes ONE array at the shortest length the guard still admits
 *   (`length-candidates`, the same solver `is-domain-empty` and `is-predicate-constraining` read), the
 *   array twin of a bounded numeric domain yielding a single point. A guard already narrowed the
 *   breadth, so there is no cardinality left to fan over — `xs.length > 3` arranges a 4-element array on
 *   the arm it satisfies and one of length 3 on the arm it does not, never a 0/1/2-element array that
 *   predicts an arm its own length cannot reach. A param with NO length guard keeps the plain fan-out.
 *
 *   A TRUTHY/FALSY/non-nullish read of an array or object param is the other half of the same
 *   agreement: `is-predicate-constraining` counts it as steerable because the truthy arm gets a real
 *   built value and the falsy arm is a nameable REFUSAL, never because a falsy array or object exists.
 *   `is-falsy-arm` — the same rule `object-arrange` already refuses a PROPERTY on — is asked of every
 *   param-level requirement below, before the generic seam fill runs, so the falsy arm's bucket reports
 *   `unfillable` for that param instead of silently receiving the generic fill's ALWAYS-truthy `{}`/`[]`.
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
 *   Every VALUE-carrying binding is checked against the SAME `param.type` it was derived from before it
 *   ships — the general form of the derived-arrange-vs-declared-type invariant. It can only disagree by
 *   BUG (every value here is built FROM the type: the domain engine, the array fan-out, the fill seam),
 *   so on correct code this never fires; it is the ratchet against a future producer that builds a
 *   binding by hand and drifts from the type a binding names its parameter by string, one object away
 *   from. A violation THROWS — Assayer contradicting a type it read itself, never the reader's debt, so
 *   there is no admission channel for it.
 *
 * USAGE:
 * causeArrangeTransformer({ requirements: cause.requirements, params, envDrivable: false });
 * // Returns { unreachable: false, unfillable: [],
 * //   arrangements: [[{ kind: 'param', param: 'score', value: 6 }, …], …] }
 */
import { arrangeValueContract, envValueContract } from '@assayer/shared/contracts';
import type { ArrangeBinding, ArrangeValue, DerivedTestCase, EnvVarName, ParamDescriptor, RepresentativeValue } from '@assayer/shared/contracts';

import type { ConditionCause } from '../../contracts/condition-cause/condition-cause-contract';
import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isDomainEmptyGuard } from '../../guards/is-domain-empty/is-domain-empty-guard';
import { isFalsyArmGuard } from '../../guards/is-falsy-arm/is-falsy-arm-guard';
import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { isValueBindingGuard } from '../../guards/is-value-binding/is-value-binding-guard';
import { arrayCardinalityStatics } from '../../statics/array-cardinality/array-cardinality-statics';
import { arrayArrangeTransformer } from '../array-arrange/array-arrange-transformer';
import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { fillParamTransformer } from '../fill-param/fill-param-transformer';
import { harnessKeyPathTransformer } from '../harness-key-path/harness-key-path-transformer';
import { intersectDomainsTransformer } from '../intersect-domains/intersect-domains-transformer';
import { lengthCandidatesTransformer } from '../length-candidates/length-candidates-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeTextTransformer } from '../type-text/type-text-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

export const causeArrangeTransformer = ({
  requirements,
  params,
  envDrivable,
  harness,
}: {
  requirements: ConditionCause['requirements'];
  params: ParamDescriptor[];
  envDrivable: boolean;
  harness?: { entry: string; params: readonly string[] } | undefined;
}): {
  unreachable: boolean;
  arrangements: DerivedTestCase['arrange'][];
  unfillable: { param: string; type: string }[];
} => {
  // A WELDED operand is a single-value domain to start from — `{members:[7]}` for a scalar const,
  // `{lengthMin:3, lengthMax:3}` for an array const's length. The guard arm values below intersect onto
  // it, so `{7} ∩ (>5)` stays `{7}` (the arm is reachable) while `{7} ∩ (<=5)` is empty (unreachable).
  // It is not an input a case sets; the analyzer evaluates it, so no `env`/`param` binding carries it.
  const constSeed = requirements.reduce<Map<string, ValueDomain>>((acc, requirement) => {
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
  }, new Map<string, ValueDomain>());

  const domainByOperand = requirements.reduce<Map<string, ValueDomain>>((acc, requirement) => {
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
    return { unreachable: true, arrangements: [], unfillable: [] };
  }

  // The parameters a harness SUPPLIES, keyed by name — each one already answered, so it never reaches
  // the seam below and can never be counted as refused. The binding names the key path rather than a
  // value: what a harness hands over is a live callback the run resolves by loading the same file. A
  // harness answering a REST parameter carries `rest: true`, the same fact an array binding carries it
  // for, so the interpreter SPREADS the resolved value across the tail positional slots instead of
  // handing it over as one argument.
  const harnessByParam = new Map(
    harness === undefined
      ? []
      : harness.params.map((param) => {
          const isRest = params.find((candidate) => String(candidate.name) === String(param))?.rest === true;

          return [
            String(param),
            {
              kind: 'harness' as const,
              param,
              key: harnessKeyPathTransformer({ entry: harness.entry, param }),
              ...(isRest ? { rest: true } : {}),
            },
          ] as const;
        }),
  );

  // Every remaining param routed through the ONE fill seam, before any arrangement is built. Asked for
  // all of them, including the constrained and the array ones, because the question the seam answers is
  // about the PARAM — a param nothing can be built for makes every arrangement of this cause a lie, so
  // the cause is dropped whole rather than per binding.
  //
  // A param with no scalar point (object, array) whose OWN truthy/falsy/non-nullish requirement wants
  // this bucket's FALSY arm is refused here BEFORE the generic fill runs: every value the seam builds
  // for such a type is truthy, so the generic fill would otherwise hand the falsy arm's bucket the exact
  // same value the truthy arm gets. `is-falsy-arm` is the same rule `object-arrange` already refuses a
  // PROPERTY with; this is its param-level call site. A property-path leaf (`config.mode`) is excluded —
  // that arm belongs to `object-arrange`, never to this scalar seam.
  const fills = params
    .filter((param) => !harnessByParam.has(String(param.name)))
    .map((param) => {
      const falsyArmRefused =
        representativeValueTransformer({ type: param.type }) === undefined &&
        requirements.some(
          (requirement) =>
            requirement.leaf.operandParamName !== undefined &&
            String(requirement.leaf.operandParamName) === String(param.name) &&
            requirement.leaf.operandPropertyPath === undefined &&
            isFalsyArmGuard({ predicateKind: requirement.leaf.predicate.kind, want: requirement.want }),
        );

      return {
        name: param.name,
        result: falsyArmRefused
          ? { kind: 'unfillable' as const, param: param.name, type: param.declaredText ?? typeTextTransformer({ type: param.type }) }
          : fillParamTransformer({ param }),
      };
    });
  const unfillable = fills.flatMap((entry) =>
    entry.result.kind === 'unfillable' ? [{ param: entry.result.param, type: entry.result.type }] : [],
  );

  if (unfillable.length > 0) {
    return { unreachable: false, arrangements: [], unfillable };
  }

  const fillByParam = new Map(
    fills.flatMap((entry) => (entry.result.kind === 'filled' ? [[String(entry.name), entry.result.binding] as const] : [])),
  );

  // Which local bindings are environment reads, keyed by the same operand name the values above are.
  // Read off the leaves rather than passed in, because the leaf is where the walk recorded it.
  const envByOperand = envDrivable
    ? requirements.reduce<Map<string, EnvVarName>>((acc, requirement) => {
        const operand = requirement.leaf.operandParamName;
        const envVarName = requirement.leaf.operandEnvVarName;

        return operand === undefined || envVarName === undefined ? acc : acc.set(operand, envVarName);
      }, new Map<string, EnvVarName>())
    : new Map<string, EnvVarName>();

  const operandChoices = [...domainByOperand.entries()].flatMap(([operand, domain]) => {
    const values = domainValuesTransformer({ domain });

    return values.length === 0 ? [] : [{ operand, values }];
  });

  const bindings = operandChoices.reduce<Map<string, RepresentativeValue>[]>(
    (combos, choice) =>
      combos.flatMap((combo) => choice.values.map((value) => new Map(combo).set(choice.operand, value))),
    [new Map<string, RepresentativeValue>()],
  );

  // Each array param is a fan-out axis over cardinality: `array-arrange` builds a real array of each
  // size class, so the derived set spans an array's input breadth the way a union operand's members do.
  // `array-cardinality` fixes the order. A param with NO `.length` guard on this bucket takes the plain
  // fan-out; one this bucket's own `.length` guard narrowed HONOURS that domain instead — `unreachable`
  // above already proved it non-empty, so `length-candidates` always has a shortest length to take, and
  // `array-arrange` builds the one real array of it. A guard already narrowed the breadth to a single
  // length, so there is no cardinality left to fan over — the array twin of a bounded numeric domain
  // realizing one point rather than a spread of them.
  const arrayChoices = params.flatMap((param) => {
    const {type} = param;

    if (type.kind !== 'array' || harnessByParam.has(String(param.name))) {
      return [];
    }

    const lengths = lengthCandidatesTransformer({ domain: domainByOperand.get(param.name) ?? valueDomainContract.parse({}) });

    if (lengths !== undefined) {
      const [length] = lengths;
      const value = length === undefined ? undefined : arrayArrangeTransformer({ element: type.element, count: Number(length) });

      return value === undefined ? [] : [{ param: param.name, values: [value] }];
    }

    return [
      {
        param: param.name,
        values: arrayCardinalityStatics.order.flatMap((cardinality) => {
          const arranged = arrayArrangeTransformer({
            element: type.element,
            count: arrayCardinalityStatics.counts[cardinality],
          });

          return arranged === undefined ? [] : [arranged];
        }),
      },
    ];
  });

  // The cartesian across array params, the ArrangeValue[] twin of `bindings`. Seeded with one empty
  // combo, so a cause with no array param yields exactly one (empty) array combo and the arrangement
  // count is unchanged.
  const arrayCombos = arrayChoices.reduce<Map<string, ArrangeValue[]>[]>(
    (combos, choice) => combos.flatMap((combo) => choice.values.map((value) => new Map(combo).set(choice.param, value))),
    [new Map<string, ArrangeValue[]>()],
  );

  // Looked up once, below, to check each built binding against the SAME descriptor it was derived
  // from — both halves already in memory at this point, one object apart.
  const paramByName = new Map(params.map((param) => [String(param.name), param] as const));

  const arrangements = bindings.flatMap((bound) =>
    arrayCombos.map((arrayCombo) => {
      const arrange: ArrangeBinding[] = [
        ...params.flatMap((param): ArrangeBinding[] => {
          // A supplied parameter first: a harness answers the question the seam and the guard domains
          // both would have been asked, so nothing below may overwrite what a human handed over.
          const supplied = harnessByParam.get(String(param.name));

          if (supplied !== undefined) {
            return [supplied];
          }

          const arrayValue = arrayCombo.get(param.name);

          // An array param is filled from its cardinality combo — a real array of this case's size class,
          // never the scalar placeholder that would make a real array method (`items.pop()`) throw. A
          // REST param's array carries `rest: true`, so the interpreter SPREADS it across the tail
          // positional slots instead of handing it over as one argument.
          if (arrayValue !== undefined) {
            return [{ kind: 'array', param: param.name, value: arrayValue, ...(param.rest === true ? { rest: true } : {}) }];
          }

          const existing = bound.get(param.name);

          if (existing !== undefined) {
            return [{ kind: 'param', param: param.name, value: existing }];
          }

          // Unconstrained: the seam's fill, already proven present by the refusal check above.
          const filled = fillByParam.get(String(param.name));

          return filled === undefined ? [] : [filled];
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
      ];

      // The general invariant: every VALUE-carrying binding this cause just built must be a value OF the
      // param's OWN declared type — the domain-derived scalar above, the array fan-out, and the seam's
      // fill all disagree with `param.type` only by BUG (each is built FROM it), so this never fires
      // against correct code and exists as the ratchet against a future producer that builds a binding
      // by hand and drifts. `env` names no param to check against and `harness` carries no value at all
      // (its half of the SAME invariant is checked earlier, in `harness-validate`, against the supplied
      // expression's STATIC type — a runtime value here could not tell one callback from another). A
      // violation is Assayer contradicting a type it read itself, never the reader's debt, so it throws
      // rather than shipping a wrong-shape value into a case that would then pass or fail on it.
      arrange
        .filter(
          (binding): binding is Extract<ArrangeBinding, { kind: 'param' } | { kind: 'array' } | { kind: 'object' }> =>
            isValueBindingGuard({ binding }),
        )
        .forEach((binding) => {
          const param = paramByName.get(String(binding.param));
          // Re-parsed through the SAME recursive contract the binding's own `value` field already
          // satisfies (an `object` binding's zod-inferred record type is not structurally an `ArrangeValue`
          // on its own, even though every value it ever holds is one) — never a bypass, since the contract
          // re-validates rather than merely asserting.
          const value = arrangeValueContract.parse(binding.value);

          if (param !== undefined && !isTypeFillableGuard({ type: param.type, value })) {
            throw new Error(
              `cause-arrange built a \`${binding.kind}\` value for \`${String(binding.param)}\` that does not satisfy ` +
                `its own declared type \`${String(param.declaredText ?? typeTextTransformer({ type: param.type }))}\`: ` +
                `${JSON.stringify(binding.value)}. Assayer contradicted a type it read itself — its own invariant ` +
                'broken, never the reader\'s debt.',
            );
          }
        });

      return arrange;
    }),
  );

  return { unreachable: false, unfillable: [], arrangements };
};
