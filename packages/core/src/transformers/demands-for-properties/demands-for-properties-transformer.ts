/**
 * PURPOSE: Splices per-property value demands onto ONE property list — the recursive core
 *   `collect-property-demands` calls at the root and calls again, one level down, for every property
 *   whose OWN type is an object that some reader reads PAST (`config.db.retry`, a demand on `db`'s own
 *   `retry`, not on `db` as a whole). The leaves handed in are already relative to THIS property list:
 *   the root call strips the leading type-ref check, and each recursive step strips one more path
 *   segment, so this function never needs to know how deep it is.
 *
 *   For each property, `type-to-range` turns its DECLARED type + a matching leaf's predicate into its
 *   satisfying/violating domains, `domain-values` realizes each into representative values, and an
 *   unconstrained arm falls back to that type's representative value (the same fill an un-narrowed case
 *   gets). A property no reader ever reaches — directly or through a deeper path — is an honest
 *   `unknown` demand, and so is one every reader reaches whose declared type names no point at all (an
 *   opaque shape under a predicate carrying no literal): a demand of no values would read as a demand.
 *
 *   A property whose type is NOT an object cannot carry a read past itself: the path simply has nowhere
 *   to go, so a leaf naming a deeper segment off a scalar property answers `unknown`, the same as any
 *   other read naming a property the type does not declare.
 *
 * USAGE:
 * demandsForPropertiesTransformer({
 *   properties: [{ name: 'db', type: { kind: 'object', properties: [{ name: 'retry', type: { kind: 'number' } }] } }],
 *   leaves: [retryLeaf], // operandPropertyPath already relative to this list: ['db', 'retry']
 * });
 * // Returns [{ name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } }]
 */
import { propertyDemandContract } from '@assayer/shared/contracts';
import type { ConditionLeaf, PropertyDemand, TypeDescriptor } from '@assayer/shared/contracts';

import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

export const demandsForPropertiesTransformer = ({
  properties,
  leaves,
}: {
  properties: readonly { name: string; type: TypeDescriptor }[];
  leaves: readonly ConditionLeaf[];
}): PropertyDemand[] =>
  [...properties]
    .sort((a, b) => (String(a.name) < String(b.name) ? -1 : 1))
    .map((property) => {
      const matching = leaves.filter(
        (leaf) => leaf.operandPropertyPath !== undefined && String(leaf.operandPropertyPath[0]) === String(property.name),
      );
      const direct = matching.filter((leaf) => leaf.operandPropertyPath?.length === 1);
      const nested = matching.filter((leaf) => (leaf.operandPropertyPath?.length ?? 0) > 1);

      // A property whose type is an object, and that some reader reads PAST — the demand becomes the
      // sub-object's own demand list, recursed exactly as this call was, with the path shifted one
      // segment so the recursive call reads it the same way this call read the leaves it was handed.
      if (nested.length > 0 && property.type.kind === 'object') {
        const shifted = nested.map((leaf) => ({
          ...leaf,
          operandPropertyPath: (leaf.operandPropertyPath ?? []).slice(1),
        }));

        return propertyDemandContract.parse({
          name: property.name,
          demand: {
            kind: 'nested',
            properties: demandsForPropertiesTransformer({ properties: property.type.properties, leaves: shifted }),
          },
        });
      }

      if (direct.length === 0) {
        return propertyDemandContract.parse({ name: property.name, demand: { kind: 'unknown' } });
      }

      // Each read fact's arms (satisfying + violating) are realized with the case engine's own value
      // math, off the property's DECLARED type — the leaf's own operand type is `any` for a cross-file
      // object, so the property's type is what carries the real domain. An unconstrained arm (an open
      // `=== 'a'` violating side) falls back to that type's representative value, exactly as an
      // un-narrowed param does.
      const values = direct.flatMap((leaf) => {
        const armValues = typeToRangeTransformer({
          type: property.type,
          predicateKind: leaf.predicate.kind,
          ...(leaf.predicate.literal === undefined ? {} : { literal: leaf.predicate.literal }),
        });

        return [armValues.satisfying, armValues.violating].flatMap((domain) => {
          const realized = domainValuesTransformer({ domain });

          if (realized.length > 0) {
            return realized;
          }

          const fallback = representativeValueTransformer({ type: property.type });

          return fallback === undefined ? [] : [fallback];
        });
      });

      const unique = [...new Map(values.map((value) => [JSON.stringify(value), value])).values()].sort((a, b) =>
        JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
      );

      return propertyDemandContract.parse(
        unique.length === 0
          ? { name: property.name, demand: { kind: 'unknown' } }
          : { name: property.name, demand: { kind: 'demanded', values: unique } },
      );
    });
