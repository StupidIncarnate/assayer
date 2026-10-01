/**
 * PURPOSE: Defines the data `gitLsTreeBroker` returns
 *
 * USAGE:
 * gitLsTreeResultContract.parse(value);
 * // Returns validated GitLsTreeResult
 */
import { z } from "#gateway/npm/zod";

export const gitLsTreeResultContract = z.array(
  z
    .object({
      relPath: z.string().brand<"GitLsTreeResultRelPath">(),
      blobSha: z.string().brand<"GitLsTreeResultBlobSha">(),
    })
    .brand<"GitLsTreeResult">(),
);

export type GitLsTreeResult = z.infer<typeof gitLsTreeResultContract>;
