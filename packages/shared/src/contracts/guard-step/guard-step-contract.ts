/**
 * PURPOSE: Contract for a guard step — one decision on the path to an exit: the branch node's
 *   coverage ID plus the arm taken (`then`, `else`, `default`, or `case:<label>`). An exit's
 *   ordered guard path is the sequence of guard steps that must hold to reach it.
 *
 * USAGE:
 * guardStepContract.parse({ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' });
 * // Returns a validated GuardStep (branded fields)
 */
import { z } from '#gateway/npm/zod';

import { coverageContract } from '../coverage/coverage-contract';

export const guardStepContract = z.object({
  branchCoverageId: coverageContract.shape.id,
  arm: z.string().min(1).brand<'GuardArm'>(),
}).brand<'GuardStep'>();

export type GuardStep = z.infer<typeof guardStepContract>;
