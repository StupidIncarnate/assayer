/**
 * PURPOSE: Arranges ONE object parameter's properties for a single input bucket — the object twin of
 *   `cause-arrange`, and the step that turns an object-member branch (`if (config.mode === 'a')`) from
 *   admitted-undriven into a driven case. For each property of the type's FULL shape it picks one
 *   scalar value, so the whole object the entry receives is built ({ mode: 'a' } for the then arm,
 *   { mode: 'dev' } for the else) — the v1 shape covers scalar-valued properties; nested objects/arrays
 *   are a later phase.
 *
 *   Every value is an INPUT, never a code-derived output (P4). A property with a COMMITTED correction
 *   (its name in `corrected`) is AUTHORITATIVE: its narrowed domain is SEEDED from the corrected values,
 *   so only a corrected value is ever arranged — the branch literal is never a fallback. A property
 *   WITHOUT a correction is narrowed by the SAME `type-to-range → intersect-domains` math the case
 *   engine runs, then filled by the FIRST demanded value the domain admits, else the domain's own
 *   representative, else the type's fill — a derived demand inherently contains the branch literals, so
 *   the constrained arm is always reachable. A property the bucket does NOT constrain takes its first
 *   demanded value, or — when no reader ever demanded one (an `unknown` demand) — its type's fill.
 *
 *   `unreachable` is true when any constrained property's narrowed domain is provably empty: two guards
 *   on one property that cannot both hold, OR a corrected property none of whose authoritative values
 *   satisfies the guard (the human's truth contradicts the branch — flagged as a P1 by
 *   `stub-contradictions` before running). Either way the bucket reaches no exit and the caller drops
 *   it rather than emitting a bogus case, exactly as `cause-arrange` reports an empty scalar
 *   intersection.
 *
 * USAGE:
 * objectArrangeTransformer({ param: 'config', declaredType, demands, requirements, corrected: ['mode'] });
 * // Returns { unreachable: false, properties: [{ name: 'mode', value: 'a' }, …] } — sorted by name
 */
import type { ConditionLeaf, DeclaredType, PropertyDemand, RepresentativeValue, SymbolName } from '@assayer/shared/contracts';

import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isDomainEmptyGuard } from '../../guards/is-domain-empty/is-domain-empty-guard';
import { isValueInDomainGuard } from '../../guards/is-value-in-domain/is-value-in-domain-guard';
import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { intersectDomainsTransformer } from '../intersect-domains/intersect-domains-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

export const objectArrangeTransformer = ({
  param,
  declaredType,
  demands,
  requirements,
  corrected,
}: {
  param: SymbolName;
  declaredType: DeclaredType;
  demands: PropertyDemand[];
  requirements: { leaf: ConditionLeaf; want: boolean }[];
  corrected: readonly SymbolName[];
}): { unreachable: boolean; properties: { name: SymbolName; value: RepresentativeValue }[] } => {
  const correctedNames = new Set(corrected.map((name) => String(name)));

  const picks = [...declaredType.properties]
    .sort((a, b) => (String(a.name) < String(b.name) ? -1 : 1))
    .map((property) => {
      // The bucket's requirements that turn on THIS property — a single-level `config.<name>` read whose
      // root is this param. A nested read (`config.user.role`) constrains a sub-object, a later rung.
      const propertyRequirements = requirements.filter(
        (requirement) =>
          requirement.leaf.operandParamName !== undefined &&
          String(requirement.leaf.operandParamName) === String(param) &&
          requirement.leaf.operandPropertyPath !== undefined &&
          requirement.leaf.operandPropertyPath.length === 1 &&
          String(requirement.leaf.operandPropertyPath[0]) === String(property.name),
      );

      const demand = demands.find((entry) => String(entry.name) === String(property.name))?.demand;
      const demandedValues = demand !== undefined && demand.kind === 'demanded' ? demand.values : [];

      if (propertyRequirements.length === 0) {
        // Unconstrained: a demanded/corrected stub value if any, else the type's fill. `unknown` owns no
        // value, so it degrades to the same representative fill an un-narrowed scalar param gets.
        const value = demandedValues[0] ?? representativeValueTransformer({ type: property.type });
        return { name: property.name, value, unreachable: false };
      }

      // Narrow the property to the domain every requirement on it agrees on, off its DECLARED type — the
      // leaf's own operand type is `any` for a cross-file object, so the property's type is what carries
      // the real domain. `want` selects the arm: satisfying when the leaf must hold, violating otherwise.
      const armDomains = propertyRequirements.map((requirement) => {
        const armValues = typeToRangeTransformer({
          type: property.type,
          predicateKind: String(requirement.leaf.predicate.kind),
          ...(requirement.leaf.predicate.literal === undefined ? {} : { literal: requirement.leaf.predicate.literal }),
        });
        return requirement.want ? armValues.satisfying : armValues.violating;
      });

      if (correctedNames.has(String(property.name))) {
        // A committed correction is AUTHORITATIVE: the property may take ONLY its corrected values, so the
        // narrowed domain is SEEDED from them and the branch literal is never a fallback. When no corrected
        // value satisfies the guard the domain is empty — the branch is unreachable under the human's
        // truth, reported as a pre-run contradiction by `stub-contradictions`.
        const domain = armDomains.reduce<ValueDomain>(
          (left, right) => intersectDomainsTransformer({ left, right }),
          valueDomainContract.parse({ members: demandedValues }),
        );
        const unreachable = isDomainEmptyGuard({ domain });
        const value =
          demandedValues.find((candidate) => isValueInDomainGuard({ value: candidate, domain })) ??
          demandedValues[0] ??
          representativeValueTransformer({ type: property.type });

        return { name: property.name, value, unreachable };
      }

      const domain = armDomains.reduce<ValueDomain | undefined>(
        (left, right) => (left === undefined ? right : intersectDomainsTransformer({ left, right })),
        undefined,
      );

      const unreachable = domain !== undefined && isDomainEmptyGuard({ domain });
      // Prefer the FIRST demanded value the domain admits, then the domain's own realized value, then the
      // type's representative fill — a derived demand always contains the branch literal, so this holds.
      const preferred = domain === undefined ? undefined : demandedValues.find((value) => isValueInDomainGuard({ value, domain }));
      const realized = domain === undefined ? [] : domainValuesTransformer({ domain });
      const value = preferred ?? realized[0] ?? representativeValueTransformer({ type: property.type });

      return { name: property.name, value, unreachable };
    });

  return {
    unreachable: picks.some((pick) => pick.unreachable),
    properties: picks.map((pick) => ({ name: pick.name, value: pick.value })),
  };
};
