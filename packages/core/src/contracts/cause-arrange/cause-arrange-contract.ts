/**
 * PURPOSE: Defines the data `causeArrangeTransformer` returns
 *
 * USAGE:
 * causeArrangeContract.parse(value);
 * // Returns validated CauseArrange
 */
import { z } from "#gateway/npm/zod";
import { derivedTestCaseContract } from "@assayer/shared/contracts";

export const causeArrangeContract = z
  .object({
    unreachable: z.boolean(),
    arrangements: z.array(derivedTestCaseContract.shape.arrange),
    // The operands whose domain holds exactly ONE member once every guard is applied: the value is decided,
    // not merely chosen. A derived guard over such an operand can be settled either way. Absent when none.
    pinned: z.array(z.string().brand<"CauseArrangePinned">()).optional(),
    unfillable: z.array(
      z
        .object({
          param: z.string().brand<"CauseArrangeUnfillableParam">(),
          type: z.string().brand<"CauseArrangeUnfillableType">(),
        })
        .brand<"CauseArrangeUnfillable">(),
    ),
  })
  .brand<"CauseArrange">();

export type CauseArrange = z.infer<typeof causeArrangeContract>;
