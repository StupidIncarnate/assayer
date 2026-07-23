/**
 * PURPOSE: Splices a stubbed object type's per-property value demands onto its FULL declared property
 *   list — the value math the stub stitch runs per type. For each property the type declares, it finds
 *   the object-member read facts that branch on THAT property (a single-level `config.mode` read whose
 *   root type-reference is this type) and reuses the SAME scalar value math the case engine uses:
 *   `type-to-range` turns the leaf's operand type + predicate into its satisfying/violating domains,
 *   `domain-values` realizes each into representative values, and an unconstrained arm falls back to
 *   the operand's representative value (the same fill an un-narrowed case gets). Values are deduped and
 *   sorted for byte-identical output. A property no reader branches on is an honest `unknown` — no
 *   value is invented for it.
 *
 *   Values are sourced from the operand's type and predicate, never from executing the code (P4). A
 *   NESTED read (`obj.user.role`) names a sub-object property whose scalar demand needs the sub-type
 *   resolved — a later rung — so only single-level reads contribute here; a top-level property those
 *   never touch stays `unknown` rather than borrowing a nested value.
 *
 * USAGE:
 * collectPropertyDemandsTransformer({ declaredType, leaves });
 * // Returns [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
 * //          { name: 'retries', demand: { kind: 'unknown' } }]
 */
import { propertyDemandContract } from '@assayer/shared/contracts';
import type { ConditionLeaf, DeclaredType, PropertyDemand } from '@assayer/shared/contracts';

import { domainValuesTransformer } from '../domain-values/domain-values-transformer';
import { representativeValueTransformer } from '../representative-value/representative-value-transformer';
import { typeToRangeTransformer } from '../type-to-range/type-to-range-transformer';

export const collectPropertyDemandsTransformer = ({
  declaredType,
  leaves,
}: {
  declaredType: DeclaredType;
  leaves: ConditionLeaf[];
}): PropertyDemand[] =>
  [...declaredType.properties]
    .sort((a, b) => (String(a.name) < String(b.name) ? -1 : 1))
    .map((property) => {
      const matching = leaves.filter(
        (leaf) =>
          leaf.operandTypeRef !== undefined &&
          String(leaf.operandTypeRef) === String(declaredType.name) &&
          leaf.operandPropertyPath !== undefined &&
          leaf.operandPropertyPath.length === 1 &&
          String(leaf.operandPropertyPath[0]) === String(property.name),
      );

      if (matching.length === 0) {
        return propertyDemandContract.parse({ name: property.name, demand: { kind: 'unknown' } });
      }

      // Each read fact's arms (satisfying + violating) are realized with the case engine's own value
      // math; an unconstrained arm (an open `=== 'a'` violating side) falls back to the operand's
      // representative value, exactly as an un-narrowed param does.
      const values = matching.flatMap((leaf) => {
        const armValues = typeToRangeTransformer({
          type: leaf.operandType,
          predicateKind: String(leaf.predicate.kind),
          ...(leaf.predicate.literal === undefined ? {} : { literal: leaf.predicate.literal }),
        });

        return [armValues.satisfying, armValues.violating].flatMap((domain) => {
          const realized = domainValuesTransformer({ domain });
          return realized.length === 0 ? [representativeValueTransformer({ type: leaf.operandType })] : realized;
        });
      });

      const unique = [...new Map(values.map((value) => [JSON.stringify(value), value])).values()].sort((a, b) =>
        JSON.stringify(a) < JSON.stringify(b) ? -1 : 1,
      );

      return propertyDemandContract.parse({ name: property.name, demand: { kind: 'demanded', values: unique } });
    });
