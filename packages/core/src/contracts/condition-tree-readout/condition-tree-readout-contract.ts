/**
 * PURPOSE: A branch condition decomposed into its boolean tree, plus the probe site of every leaf the
 *   same descent assigned an id to. `readConditionTreeLayerTransformer` returns this for an `if` or
 *   ternary condition, and `readNullishLeafLayerTransformer` returns it for a `??` operand's single
 *   non-nullish leaf. Reach for this when the probe sites must travel with the condition; the bare
 *   tree alone is a `ConditionNode`.
 *
 * USAGE:
 * conditionTreeReadoutContract.parse({ condition: { kind: 'leaf', … }, sites: [{ id, kind: 'cond', start: 4, end: 9 }] });
 * // Returns a validated ConditionTreeReadout
 */
import { z } from '#gateway/npm/zod';

import { conditionNodeContract } from '@assayer/shared/contracts';

import { probeSiteContract } from '../probe-site/probe-site-contract';

export const conditionTreeReadoutContract = z
  .object({
    condition: conditionNodeContract,
    sites: z.array(probeSiteContract),
  })
  .brand<'ConditionTreeReadout'>();

export type ConditionTreeReadout = z.infer<typeof conditionTreeReadoutContract>;
