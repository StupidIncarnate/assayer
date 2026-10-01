/**
 * PURPOSE: Defines the data `gatherTypeReadsTransformer` returns
 *
 * USAGE:
 * gatherTypeReadsContract.parse(value);
 * // Returns validated GatherTypeReads
 */
import { z } from "#gateway/npm/zod";
import {
  declaredTypeContract,
  conditionLeafContract,
} from "@assayer/shared/contracts";

export const gatherTypeReadsContract = z.array(
  z
    .object({
      definitionRelPath: z.string().brand<"GatherTypeReadsDefinitionRelPath">(),
      typeName: z.string().brand<"GatherTypeReadsTypeName">(),
      declaredType: declaredTypeContract,
      readers: z.array(z.string().brand<"GatherTypeReadsReaders">()),
      leaves: z.array(conditionLeafContract),
    })
    .brand<"GatherTypeReads">(),
);

export type GatherTypeReads = z.infer<typeof gatherTypeReadsContract>;
