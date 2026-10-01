/**
 * PURPOSE: Defines the data `gatherEnvReadsTransformer` returns
 *
 * USAGE:
 * gatherEnvReadsContract.parse(value);
 * // Returns validated GatherEnvReads
 */
import { z } from "#gateway/npm/zod";
import { representativeValueContract } from "@assayer/shared/contracts";

export const gatherEnvReadsContract = z.array(
  z
    .object({
      property: z.string().brand<"GatherEnvReadsProperty">(),
      literals: z.array(representativeValueContract),
      readers: z.array(z.string().brand<"GatherEnvReadsReaders">()),
    })
    .brand<"GatherEnvReads">(),
);

export type GatherEnvReads = z.infer<typeof gatherEnvReadsContract>;
