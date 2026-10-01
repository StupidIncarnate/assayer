/**
 * PURPOSE: Contract for one FLATTENED stub-property display row — the property's full dotted path
 *   (`db.retry` for a demand nested one level under `db`) paired with the leaf demand the
 *   stub-repository view already knows how to render, `unknown` or `demanded`. A `nested` demand is
 *   never a valid leaf here: it is expanded into its own rows by `flatten-property-demand` before this
 *   contract ever sees it.
 *
 * USAGE:
 * flatPropertyDemandContract.parse({ name: 'db.retry', demand: { kind: 'demanded', values: [3, 7] } });
 * // Returns a validated FlatPropertyDemand
 */
import { z } from '#gateway/npm/zod';

import { representativeValueContract, symbolNameContract } from '@assayer/shared/contracts';

export const flatPropertyDemandContract = z.object({
  name: symbolNameContract,
  demand: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('unknown') }),
    z.object({ kind: z.literal('demanded'), values: z.array(representativeValueContract) }),
  ]),
});

export type FlatPropertyDemand = z.infer<typeof flatPropertyDemandContract>;
