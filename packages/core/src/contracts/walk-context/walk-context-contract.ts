/**
 * PURPOSE: Contract for the walk context — everything the walk carries DOWN to a node from the
 *   nodes enclosing it. Two independent axes travel here, and their differing behaviour at a
 *   function boundary is the whole reason the walk exists: `scopePath` EXTENDS (a nested function is
 *   owned by its parent's path), while `guardPath` RESETS (a function's internal branches are not
 *   guarded by the `if` its declaration happens to sit inside). Reconstructing either by climbing
 *   ancestors — the thing this replaces — is what made constructs unable to compose.
 *
 *   `tail` says whether reaching the END of this node ends the scope. It is what lets a bare
 *   top-level `if` and an `if` inside a function be the same handler: when the `if` is the last
 *   thing that runs, each arm's completion IS an exit worth a test case; when code follows it, the
 *   arms merely converge and only the scope's own end is an exit. Without it, "per-arm exits" would
 *   have to be a rung-specific rule — which is exactly the duplication this design removes.
 *
 *   `enclosingClass` travels here for the same reason everything else does: a method needs its
 *   class's name and constructability to be addressable, and the class is the only node that knows
 *   them. Climbing back up to find it would re-create the ownership bug this walk exists to remove.
 *
 * USAGE:
 * walkContextContract.parse({ scopePath: ['classify'], guardPath: [], params: [], exported: true, tail: true });
 * // Returns a validated WalkContext (branded fields)
 */
import { z } from 'zod';

import { guardStepContract, paramDescriptorContract, symbolNameContract } from '@assayer/shared/contracts';

export const walkContextContract = z.object({
  scopePath: z.array(symbolNameContract),
  guardPath: z.array(guardStepContract),
  params: z.array(paramDescriptorContract),
  exported: z.boolean(),
  tail: z.boolean(),
  enclosingClass: z.object({ name: symbolNameContract, constructable: z.boolean() }).optional(),
});

export type WalkContext = z.infer<typeof walkContextContract>;
