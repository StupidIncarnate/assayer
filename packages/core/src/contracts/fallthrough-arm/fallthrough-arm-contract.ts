/**
 * PURPOSE: Contract for a fall-through arm — one arm of a branch whose statements can run to their end
 *   and continue into the code after the branch, so the arm owns no exit of its own. It carries the
 *   arm's full guard path (the enclosing guards plus the arm's own step) and the line span of its
 *   statements. `derive-cases` reads it to report an arm a welded constant or contradicting guards can
 *   never enter: such an arm has no exit for the `unreachable-exit` rule to name, so without this record
 *   the dead code would be reported nowhere.
 *
 * USAGE:
 * fallthroughArmContract.parse({
 *   guardPath: [{ branchCoverageId: 'classify/if:…', arm: 'then' }], startLine: 4, endLine: 4,
 * });
 * // Returns a validated FallthroughArm
 */
import { z } from '#gateway/npm/zod';

import { guardStepContract } from '@assayer/shared/contracts';

export const fallthroughArmContract = z
  .object({
    guardPath: z.array(guardStepContract),
    // The arm's first statement line, and the line its last statement ends on. The braces of a block arm
    // are not part of the span, because the dead code a reader deletes is the statements.
    startLine: z.number().int().positive().brand<'FallthroughArmStartLine'>(),
    endLine: z.number().int().positive().brand<'FallthroughArmEndLine'>(),
  })
  .brand<'FallthroughArm'>();

export type FallthroughArm = z.infer<typeof fallthroughArmContract>;
