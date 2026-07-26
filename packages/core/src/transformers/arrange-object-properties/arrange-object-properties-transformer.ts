/**
 * PURPOSE: Arranges ONE property list into a value picture — the recursive core `object-arrange` calls
 *   at the root and calls again, one level down, for every property whose OWN type is an object that
 *   some requirement constrains PAST itself (`config.db.retry`, a requirement on `db`'s own `retry`,
 *   not on `db` as a whole). The requirements handed in are already relative to THIS property list: the
 *   root call filters to the arranged param and strips nothing yet, and each recursive step shifts the
 *   path by one segment, so this function never needs to know how deep it is.
 *
 *   For a property with no requirement reaching PAST it, this is character-for-character the math
 *   `object-arrange`'s own doc describes: a demanded/corrected value the narrowed domain admits, else
 *   the domain's own realized value, else the seam's fill. For a property some requirement constrains
 *   past itself, the value is built by recursing into that property's OWN shape with the constraining
 *   requirements' paths shifted one segment — the object twin of walking one more level into a nested
 *   type. A committed correction is AUTHORITATIVE only at the level it was written for: an overlay
 *   corrects the TOP-level properties of the type it keys on, so a correction is consulted only at the
 *   level `object-arrange` was called with one, and every deeper level recurses with none — a property
 *   two levels down has no overlay of its own to be authoritative FROM.
 *
 *   `unreachable` and `unfillable` both propagate up through the recursion exactly as they do across
 *   sibling properties at one level: a nested pick's own `unreachable`/`unfillable` becomes this
 *   property's, so a contradiction three levels deep still drops the whole bucket, and a hole three
 *   levels deep still leaves the whole object unbuilt.
 *
 *   A DIRECT requirement can coexist with a NESTED one on the same object-typed property only as a
 *   truthiness read alongside a deeper one (`if (config.db && config.db.retry === 3)`): a demanded
 *   FALSY arm contradicts a deeper read (no value this recursion builds is ever falsy), so that
 *   combination is unreachable; a demanded TRUTHY arm needs no separate check, since anything this
 *   recursion builds already satisfies it.
 *
 * USAGE:
 * arrangeObjectPropertiesTransformer({
 *   properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } }],
 *   demands: [{ name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } }],
 *   requirements: [{ leaf: retryLeaf, want: true }], // operandPropertyPath already relative: ['db', 'retry']
 *   corrected: new Set(),
 * });
 * // Returns { unreachable: false, unfillable: false, properties: [{ name: 'db', value: { retry: 3 } }] }
 */
import type { ArrangeValue, ConditionLeaf, PropertyDemand, SymbolName, TypeDescriptor } from '@assayer/shared/contracts';

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

export const arrangeObjectPropertiesTransformer = ({
  properties,
  demands,
  requirements,
  corrected,
}: {
  properties: readonly { name: SymbolName; type: TypeDescriptor }[];
  demands: readonly PropertyDemand[];
  requirements: readonly { leaf: ConditionLeaf; want: boolean }[];
  corrected: ReadonlySet<string>;
}): { unreachable: boolean; unfillable: boolean; properties: { name: SymbolName; value: ArrangeValue }[] } => {
  const picks = [...properties]
    .sort((a, b) => (String(a.name) < String(b.name) ? -1 : 1))
    .map((property) => {
      // The bucket's requirements that turn on THIS property — a read whose path (already relative to
      // this list) starts with this property's own name.
      const own = requirements.filter(
        (requirement) =>
          requirement.leaf.operandPropertyPath !== undefined &&
          String(requirement.leaf.operandPropertyPath[0]) === String(property.name),
      );
      const propertyRequirements = own.filter((requirement) => requirement.leaf.operandPropertyPath?.length === 1);
      const nestedRequirements = own.filter((requirement) => (requirement.leaf.operandPropertyPath?.length ?? 0) > 1);
      const demand = demands.find((entry) => String(entry.name) === String(property.name))?.demand;

      if (nestedRequirements.length > 0 && property.type.kind === 'object') {
        const shifted = nestedRequirements.map((requirement) => ({
          want: requirement.want,
          leaf: { ...requirement.leaf, operandPropertyPath: (requirement.leaf.operandPropertyPath ?? []).slice(1) },
        }));
        const nestedDemands = demand !== undefined && demand.kind === 'nested' ? demand.properties : [];
        // A correction addresses the TOP-level properties of the type it was written against, never a
        // path this deep — a deeper level always recurses with no correction of its own.
        const sub = arrangeObjectPropertiesTransformer({
          properties: property.type.properties,
          demands: nestedDemands,
          requirements: shifted,
          corrected: new Set(),
        });

        // A demanded FALSY arm on this same property contradicts a deeper read: no object this
        // recursion builds is ever falsy, so the two arms cannot both hold. A demanded TRUTHY arm needs
        // no extra check — any built object already satisfies it.
        const falsyContradiction = propertyRequirements.some((requirement) =>
          isFalsyArmGuard({ predicateKind: String(requirement.leaf.predicate.kind), want: requirement.want }),
        );

        return {
          name: property.name,
          value: sub.unfillable ? undefined : Object.fromEntries(sub.properties.map((p) => [String(p.name), p.value])),
          unreachable: sub.unreachable || falsyContradiction,
        };
      }

      const demandedValues = demand !== undefined && demand.kind === 'demanded' ? demand.values : [];
      // Only the demands that ARE values of this property's declared type may be placed in it. The stub
      // unions every reader's demands onto one property, so `cfg.tags.length > 3` in one entry leaves a
      // string demand on a `string[]` that a second entry's arrangement would otherwise hand over — a
      // runnable case, built on an input of the wrong shape, that passes because nothing reads it.
      const usableValues = demandedValues.filter((candidate) => isTypeFillableGuard({ type: property.type, value: candidate }));

      if (propertyRequirements.length === 0) {
        // Unconstrained: a usable demanded/corrected stub value if any, else the seam's fill. `unknown`
        // owns no value, and neither does a demand of the wrong shape, so both degrade to the same fill
        // an un-narrowed param gets — and refuse the same way. An explicit `undefined` check, never `??`:
        // a demanded value can legitimately BE `null` (a `string | null` property), and `??` would
        // discard that null for a freshly-built fill.
        const value = usableValues[0] === undefined ? fillValueTransformer({ type: property.type }) : usableValues[0];
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

      if (corrected.has(String(property.name))) {
        // A committed correction is AUTHORITATIVE: the property may take ONLY its corrected values, so the
        // narrowed domain is SEEDED from them and the branch literal is never a fallback. When no corrected
        // value satisfies the guard the domain is empty — the branch is unreachable under the human's
        // truth, reported as a pre-run contradiction by `stub-contradictions`.
        const domain = armDomains.reduce<ValueDomain>(
          (left, right) => intersectDomainsTransformer({ left, right }),
          valueDomainContract.parse({ members: demandedValues }),
        );
        const unreachable = isDomainEmptyGuard({ domain });
        // Explicit `undefined` checks, never `??`: the domain match or the first usable value can
        // legitimately BE `null`, and `??` would discard it for a freshly-built fill.
        const inDomain = usableValues.find((candidate) => isValueInDomainGuard({ value: candidate, domain }));
        const value =
          inDomain === undefined
            ? usableValues[0] === undefined
              ? fillValueTransformer({ type: property.type })
              : usableValues[0]
            : inDomain;

        return { name: property.name, value, unreachable };
      }

      const domain = armDomains.reduce<ValueDomain | undefined>(
        (left, right) => (left === undefined ? right : intersectDomainsTransformer({ left, right })),
        undefined,
      );

      const unreachable = domain !== undefined && isDomainEmptyGuard({ domain });
      // Prefer the FIRST demanded value the domain admits, then the domain's own realized value, then the
      // type's representative fill — a derived demand always contains the branch literal, so this holds.
      // Explicit `undefined` checks, never `??`: a `??`-guarded property realizes its violating domain as
      // exactly `{ members: [null] }` (`type-to-range`'s `non-nullish` arm), and `??` would discard that
      // legitimate `null` for a freshly-built non-null fill.
      const preferred = domain === undefined ? undefined : usableValues.find((value) => isValueInDomainGuard({ value, domain }));
      const realized = domain === undefined ? [] : domainValuesTransformer({ domain });
      const value =
        preferred === undefined
          ? realized[0] === undefined
            ? fillValueTransformer({ type: property.type })
            : realized[0]
          : preferred;

      return { name: property.name, value, unreachable };
    });

  return {
    unreachable: picks.some((pick) => pick.unreachable),
    // A property the seam refused, or a nested build that came back with a hole, leaves the object with
    // no complete value to pass.
    unfillable: picks.some((pick) => pick.value === undefined),
    properties: picks.flatMap((pick) => (pick.value === undefined ? [] : [{ name: pick.name, value: pick.value }])),
  };
};
