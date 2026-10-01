/**
 * PURPOSE: Contract for a property demand — one property of a stubbed object type spliced onto the
 *   type's FULL property list with the value picture the code carries for it. `demanded` names the
 *   representative values the code branches on for that property (derived from the branch operand's
 *   type + predicate, never from executing the code — P4); `unknown` is the honest state of a
 *   property no reader ever branches on — no value is invented for it; `nested` is the same picture
 *   one level down, for a property whose OWN type is an object and that some reader constrains PAST
 *   itself (`config.db.retry`, a demand on `db`'s own `retry` property, not on `db` as a whole).
 *   Recursive for the same reason the type descriptor it mirrors is: a property path may run through
 *   any number of nested objects, and each level splices its demands onto that level's FULL property
 *   list exactly as the top level does.
 *
 *   `cardinality` is reserved for a future ARRAY-property rung (empty / one / many / max) and omitted
 *   until then, so a scalar property never carries a count it does not have.
 *
 * USAGE:
 * propertyDemandContract.parse({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } });
 * propertyDemandContract.parse({ name: 'retries', demand: { kind: 'unknown' } });
 * propertyDemandContract.parse({
 *   name: 'db',
 *   demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] },
 * });
 * // Returns a validated PropertyDemand (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { arrayCardinalityContract } from '../array-cardinality/array-cardinality-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';
import type { RepresentativeValue } from '../representative-value/representative-value-contract';

export interface PropertyDemand {
  name: string;
  demand:
    | { kind: 'demanded'; values: RepresentativeValue[]; cardinality?: z.infer<typeof arrayCardinalityContract> | undefined }
    | { kind: 'unknown' }
    | { kind: 'nested'; properties: PropertyDemand[] };
}

export const propertyDemandContract: z.ZodType<PropertyDemand> = z.lazy(() =>
  z.object({
    name: z.string().min(1).brand<'PropertyDemandName'>(),
    demand: z.discriminatedUnion('kind', [
      z.object({
        kind: z.literal('demanded'),
        values: z.array(representativeValueContract),
        cardinality: arrayCardinalityContract.optional(),
      }),
      z.object({ kind: z.literal('unknown') }),
      z.object({ kind: z.literal('nested'), properties: z.array(propertyDemandContract) }),
    ]),
  }),
);
