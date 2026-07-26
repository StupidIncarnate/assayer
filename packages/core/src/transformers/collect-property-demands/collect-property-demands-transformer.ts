/**
 * PURPOSE: Splices a stubbed object type's per-property value demands onto its FULL declared property
 *   list — the value math the stub stitch runs per type. It filters the leaves to the ones that read
 *   THIS type (root type-reference matches, and the read is an object-member read at all), then hands
 *   the type's own property list and those leaves to `demands-for-properties`, the recursive splice — a
 *   `config.db.retry` read is answered by that same recursion descending into `db`'s own shape, so a
 *   deep read is spliced exactly the way a one-level read always was.
 *
 *   Values are sourced from the operand's type and predicate, never from executing the code (P4).
 *
 * USAGE:
 * collectPropertyDemandsTransformer({ declaredType, leaves });
 * // Returns [{ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
 * //          { name: 'retries', demand: { kind: 'unknown' } },
 * //          { name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } }]
 */
import type { ConditionLeaf, DeclaredType, PropertyDemand } from '@assayer/shared/contracts';

import { demandsForPropertiesTransformer } from '../demands-for-properties/demands-for-properties-transformer';

export const collectPropertyDemandsTransformer = ({
  declaredType,
  leaves,
}: {
  declaredType: DeclaredType;
  leaves: ConditionLeaf[];
}): PropertyDemand[] => {
  const relevant = leaves.filter(
    (leaf) =>
      leaf.operandTypeRef !== undefined &&
      String(leaf.operandTypeRef) === String(declaredType.name) &&
      leaf.operandPropertyPath !== undefined,
  );

  return demandsForPropertiesTransformer({ properties: declaredType.properties, leaves: relevant });
};
