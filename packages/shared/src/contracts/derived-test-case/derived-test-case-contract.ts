/**
 * PURPOSE: Contract for a derived test case — the salient, structurally-asserting case Assayer
 *   would generate for one reachable exit: the arrange bindings (param → representative value
 *   drawn from the input domain, P4-safe) and the coverage ID of the exit the flow must reach.
 *
 * USAGE:
 * derivedTestCaseContract.parse({
 *   reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }],
 * });
 * // Returns a validated DerivedTestCase (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { symbolNameContract } from '../symbol-name/symbol-name-contract';
import { representativeValueContract } from '../representative-value/representative-value-contract';

export const derivedTestCaseContract = z.object({
  reachesExit: coverageIdContract,
  arrange: z.array(z.object({ param: symbolNameContract, value: representativeValueContract })),
});

export type DerivedTestCase = z.infer<typeof derivedTestCaseContract>;
