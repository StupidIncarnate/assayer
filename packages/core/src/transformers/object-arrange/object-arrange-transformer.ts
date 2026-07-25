/**
 * PURPOSE: Arranges ONE object parameter's properties for a single input bucket — the object twin of
 *   `cause-arrange`, and the step that turns an object-member branch (`if (config.mode === 'a')`) from
 *   admitted-undriven into a driven case. For each property of the type's FULL shape it picks one
 *   value, so the whole object the entry receives is built ({ mode: 'a' } for the then arm,
 *   { mode: 'dev' } for the else). A property a bucket CONSTRAINS takes a scalar from the narrowed
 *   domain; a property it does not takes whatever the fill seam builds for its declared type, so a
 *   nested object or array property is built out rather than flattened.
 *
 *   Every value is an INPUT, never a code-derived output (P4). A property with a COMMITTED correction
 *   (its name in `corrected`) is AUTHORITATIVE: its narrowed domain is SEEDED from the corrected values,
 *   so only a corrected value is ever arranged — the branch literal is never a fallback. A property
 *   WITHOUT a correction is narrowed by the SAME `type-to-range → intersect-domains` math the case
 *   engine runs, then filled by the FIRST demanded value the domain admits, else the domain's own
 *   representative, else the seam's fill — a derived demand inherently contains the branch literals, so
 *   the constrained arm is always reachable. A property the bucket does NOT constrain takes its first
 *   demanded value, or — when no reader ever demanded one (an `unknown` demand) — the seam's fill.
 *
 *   A demanded value is only ever placed where it IS a value of the property's DECLARED type
 *   (`is-type-fillable`, the same rule the fill seam builds by, asked of a candidate). Demands are
 *   UNIONED across every reader of the type, so a property one entry length-guards (`cfg.tags.length > 3`
 *   on a `string[]`) contributes string demands that a SECOND entry — one that never reads `tags` — would
 *   otherwise place into the array property and run a passing case on. A demand of the wrong shape is
 *   dropped and the property falls through to the seam's fill, which refuses if it cannot build one.
 *
 *   `unreachable` is true when any constrained property's narrowed domain is provably empty: two guards
 *   on one property that cannot both hold, OR a corrected property none of whose authoritative values
 *   satisfies the guard (the human's truth contradicts the branch — flagged as a P1 by
 *   `stub-contradictions` before running). Either way the bucket reaches no exit and the caller drops
 *   it rather than emitting a bogus case, exactly as `cause-arrange` reports an empty scalar
 *   intersection.
 *
 *   `unfillable` is the OTHER reason a bucket is dropped and never the same one: a property whose type
 *   the fill seam refuses (a callable member, an opaque `Map<string, number>`) leaves the object with a
 *   hole, so no value of the declared shape exists. A property whose narrowed domain NAMES a value point
 *   its declared type has none of lands there too — a domain realizes scalars, and no string is a
 *   `string[]`, so `cfg.tags.length > 3` refuses `tags` rather than arranging a four-character string a
 *   length guard would happily measure. So does the FALSY arm of a truthiness read on such a type
 *   (`is-falsy-arm`): every value the seam builds is truthy, so the else side of `if (config.db)` has no
 *   value, while its then side takes the ordinary fill and arranges the real `{ host: 'abc123' }`.
 *   Nothing is dead in any of these — merging them into `unreachable` would report correct code as a
 *   contradiction, and the walk drops `undefined` besides, so `db?: Db` and `db: Db` read alike here.
 *
 * USAGE:
 * objectArrangeTransformer({ param: 'config', declaredType, demands, requirements, corrected: ['mode'] });
 * // Returns { unreachable: false, unfillable: false, properties: [{ name: 'mode', value: 'a' }, …] } — sorted by name
 */
import type { ArrangeValue, ConditionLeaf, DeclaredType, PropertyDemand, SymbolName } from '@assayer/shared/contracts';

import { valueDomainContract } from '../../contracts/value-domain/value-domain-contract';
import type { ValueDomain } from '../../contracts/value-domain/value-domain-contract';
import { isDomainEmptyGuard } from '../../guards/is-domain-empty/is-domain-empty-guard';
import { isDomainUnconstrainedGuard } from '../../guards/is-domain-unconstrained/is-domain-unconstrained-guard';
import { isFalsyArmGuard } from '../../guards/is-falsy-arm/is-falsy-arm-guard';
import { isTypeFillableGuard } from '../../guards/is-type-fillable/is-type-fillable-guard';
import { isValueInDomainGuard } from '../../guards/is-value-in-domain/is-value-in-domain-guard';
import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { fillValueTransformer } from '../fill-value/fill-value-transformer';
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
}): { unreachable: boolean; unfillable: boolean; properties: { name: SymbolName; value: ArrangeValue }[] } => {
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
      // Only the demands that ARE values of this property's declared type may be placed in it. The stub
      // unions every reader's demands onto one property, so `cfg.tags.length > 3` in one entry leaves a
      // string demand on a `string[]` that a second entry's arrangement would otherwise hand over — a
      // runnable case, built on an input of the wrong shape, that passes because nothing reads it.
      const usableValues = demandedValues.filter((candidate) =>
        isTypeFillableGuard({ type: property.type, value: candidate }),
      );

      if (propertyRequirements.length === 0) {
        // Unconstrained: a usable demanded/corrected stub value if any, else the seam's fill. `unknown`
        // owns no value, and neither does a demand of the wrong shape, so both degrade to the same fill
        // an un-narrowed param gets — and refuse the same way.
        const value = usableValues[0] ?? fillValueTransformer({ type: property.type });
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

      // Two demands a property with no scalar point cannot meet, refused together.
      //
      // A domain that NAMES a point — a literal, a numeric bound, a length axis — can only be met by a
      // property whose declared type has a scalar point. `cfg.tags.length > 3` names lengths on a
      // `string[]`, and no array of a demanded length is built yet, so the property is REFUSED: never
      // the string a length axis realizes, which the guard would then measure and PASS, and never the
      // unconstrained fill, which violates the guard it was narrowed by.
      //
      // A FALSY arm names nothing at all, so it has to be asked of the PREDICATE (`is-falsy-arm`): every
      // value the seam builds for such a type is truthy, so the else side of `if (config.db)` is refused
      // while its then side falls through to the fill and takes the real `{host:'abc123'}`.
      if (
        representativeValueTransformer({ type: property.type }) === undefined &&
        (armDomains.some((domain) => !isDomainUnconstrainedGuard({ domain })) ||
          propertyRequirements.some((requirement) =>
            isFalsyArmGuard({ predicateKind: String(requirement.leaf.predicate.kind), want: requirement.want }),
          ))
      ) {
        return { name: property.name, value: undefined, unreachable: false };
      }

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
          usableValues.find((candidate) => isValueInDomainGuard({ value: candidate, domain })) ??
          usableValues[0] ??
          fillValueTransformer({ type: property.type });

        return { name: property.name, value, unreachable };
      }

      const domain = armDomains.reduce<ValueDomain | undefined>(
        (left, right) => (left === undefined ? right : intersectDomainsTransformer({ left, right })),
        undefined,
      );

      const unreachable = domain !== undefined && isDomainEmptyGuard({ domain });
      // Prefer the FIRST demanded value the domain admits, then the domain's own realized value, then the
      // type's representative fill — a derived demand always contains the branch literal, so this holds.
      const preferred = domain === undefined ? undefined : usableValues.find((value) => isValueInDomainGuard({ value, domain }));
      const realized = domain === undefined ? [] : domainValuesTransformer({ domain });
      const value = preferred ?? realized[0] ?? fillValueTransformer({ type: property.type });

      return { name: property.name, value, unreachable };
    });

  return {
    unreachable: picks.some((pick) => pick.unreachable),
    // A property the seam refused leaves a hole, so the object has no complete value to pass.
    unfillable: picks.some((pick) => pick.value === undefined),
    properties: picks.flatMap((pick) => (pick.value === undefined ? [] : [{ name: pick.name, value: pick.value }])),
  };
};
