/**
 * PURPOSE: Contract for a guard step — one decision on the path to an exit: the branch node's
 *   coverage ID plus the arm taken (`then`, `else`, `default`, or `case:<label>`). An exit's
 *   ordered guard path is the sequence of guard steps that must hold to reach it.
 *
 * USAGE:
 * guardStepContract.parse({ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' });
 * // Returns a validated GuardStep (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';

export const guardStepContract = z.object({
  branchCoverageId: coverageIdContract,
  arm: z.string().min(1).brand<'GuardArm'>(),
});

export type GuardStep = z.infer<typeof guardStepContract>;
