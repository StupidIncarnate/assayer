/**
 * PURPOSE: Defines the data `gitDetectStableBranchBroker` returns
 *
 * USAGE:
 * gitDetectStableBranchResultContract.parse(value);
 * // Returns validated GitDetectStableBranchResult
 */
import { z } from "#gateway/npm/zod";

export const gitDetectStableBranchResultContract = z.discriminatedUnion(
  "hasGitRepo",
  [
    z
      .object({ hasGitRepo: z.literal(false) })
      .brand<"GitDetectStableBranchResult">(),
    z
      .object({
        hasGitRepo: z.literal(true),
        candidates: z.array(
          z.string().brand<"GitDetectStableBranchResultCandidates">(),
        ),
        preselected: z
          .string()
          .brand<"GitDetectStableBranchResultPreselected">()
          .optional(),
      })
      .brand<"GitDetectStableBranchResult">(),
  ],
);

export type GitDetectStableBranchResult = z.infer<
  typeof gitDetectStableBranchResultContract
>;
