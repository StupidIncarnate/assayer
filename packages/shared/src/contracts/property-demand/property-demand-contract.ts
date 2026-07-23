/**
 * PURPOSE: Contract for a property demand — one property of a stubbed object type spliced onto the
 *   type's FULL property list with the value picture the code carries for it. `demanded` names the
 *   representative values the code branches on for that property (derived from the branch operand's
 *   type + predicate, never from executing the code — P4); `unknown` is the honest state of a
 *   property no reader ever branches on — no value is invented for it.
 *
 *   `cardinality` is reserved for a future ARRAY-property rung (empty / one / many / max) and omitted
 *   until then, so a scalar property never carries a count it does not have.
 *
 * USAGE:
 * propertyDemandContract.parse({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } });
 * propertyDemandContract.parse({ name: 'retries', demand: { kind: 'unknown' } });
 * // Returns a validated PropertyDemand (branded fields)
 */
import { z } from 'zod';

import { representativeValueContract } from '../representative-value/representative-value-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';

export const propertyDemandContract = z.object({
  name: symbolNameContract,
  demand: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('demanded'),
      values: z.array(representativeValueContract),
      cardinality: z.enum(['empty', 'one', 'many', 'max']).brand<'StubCardinality'>().optional(),
    }),
    z.object({ kind: z.literal('unknown') }),
  ]),
});

export type PropertyDemand = z.infer<typeof propertyDemandContract>;
