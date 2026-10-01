/**
 * PURPOSE: Flattens an object stub's property list into display ROWS, expanding a NESTED demand
 *   (`config.db.retry`, a property whose own type is an object read PAST itself) into one row per LEAF
 *   property, named by its full dotted path (`db.retry`) — the stub-repository view renders one row per
 *   property and knows only two demand shapes, `unknown` and `demanded`; a `nested` demand has neither,
 *   so it is expanded here rather than taught to the view. Recurses to whatever depth the demand tree
 *   reaches, so a three-level read (`db.retry.backoff`) still ends at one leaf row.
 *
 * USAGE:
 * flattenPropertyDemandTransformer({
 *   properties: [{ name: 'db', demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] } }],
 * });
 * // Returns [{ name: 'db.retry', demand: { kind: 'demanded', values: [3, 7] } }]
 */
import type { PropertyDemand } from '@assayer/shared/contracts';

import { flatPropertyDemandContract } from '../../contracts/flat-property-demand/flat-property-demand-contract';
import type { FlatPropertyDemand } from '../../contracts/flat-property-demand/flat-property-demand-contract';

export const flattenPropertyDemandTransformer = ({
  properties,
  prefix,
}: {
  properties: readonly PropertyDemand[];
  prefix?: string;
}): FlatPropertyDemand[] =>
  properties.flatMap((property) => {
    const name = (prefix === undefined ? property.name : `${prefix}.${property.name}`);

    return property.demand.kind === 'nested'
      ? flattenPropertyDemandTransformer({ properties: property.demand.properties, prefix: name })
      : [flatPropertyDemandContract.parse({ name, demand: property.demand })];
  });
