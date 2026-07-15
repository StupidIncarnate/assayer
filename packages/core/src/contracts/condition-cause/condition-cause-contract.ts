/**
 * PURPOSE: Contract for a condition CAUSE — one distinct reason a condition came out a given way,
 *   as the set of leaf outcomes that produced it. `a > 5 && b < 3` is false for TWO causes: `a > 5`
 *   was false (and `b < 3` never ran), or `a > 5` was true and `b < 3` was false. Each is a separate
 *   reason and therefore a separate test case.
 *
 *   Only leaves that ACTUALLY EVALUATE appear in a cause. That is what makes short-circuiting
 *   first-class rather than lost: an omitted leaf is not "false", it is "never ran" — the
 *   distinction traditional branch coverage cannot express.
 *
 * USAGE:
 * conditionCauseContract.parse({
 *   requirements: [{ leaf: { kind: 'leaf', id: '…#leaf.0', … }, want: true }],
 * });
 * // Returns a validated ConditionCause
 */
import { z } from 'zod';

import { conditionLeafContract } from '@assayer/shared/contracts';

export const conditionCauseContract = z.object({
  requirements: z.array(z.object({ leaf: conditionLeafContract, want: z.boolean() })),
});

export type ConditionCause = z.infer<typeof conditionCauseContract>;
