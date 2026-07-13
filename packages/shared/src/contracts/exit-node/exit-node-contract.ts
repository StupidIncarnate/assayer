/**
 * PURPOSE: Contract for an exit node — a `return`, `throw`, or implicit end-of-body exit of an
 *   entry, carrying its coverage ID, kind, the ordered guard path that reaches it, and its
 *   rendered line. Exits are the unit a derived test case drives toward.
 *
 * USAGE:
 * exitNodeContract.parse({
 *   coverageId: 'formatGreeting/return@if-then', kind: 'return',
 *   guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'then' }], line: 3,
 * });
 * // Returns a validated ExitNode (branded fields)
 */
import { z } from 'zod';

import { coverageIdContract } from '../coverage-id/coverage-id-contract';
import { guardStepContract } from '../guard-step/guard-step-contract';
import { lineNumberContract } from '../line-number/line-number-contract';

export const exitNodeContract = z.object({
  coverageId: coverageIdContract,
  kind: z.enum(['return', 'throw', 'implicit']).brand<'ExitKind'>(),
  guardPath: z.array(guardStepContract),
  line: lineNumberContract,
});

export type ExitNode = z.infer<typeof exitNodeContract>;
