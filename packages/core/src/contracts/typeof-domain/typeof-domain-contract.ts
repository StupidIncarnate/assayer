/**
 * PURPOSE: Defines the data `typeofDomainTransformer` returns
 *
 * USAGE:
 * typeofDomainContract.parse(value);
 * // Returns validated TypeofDomain
 */
import { z } from "#gateway/npm/zod";
import { representativeValueContract } from "@assayer/shared/contracts";

export const typeofDomainContract = z
  .object({ members: z.array(representativeValueContract).optional() })
  .brand<"TypeofDomain">();

export type TypeofDomain = z.infer<typeof typeofDomainContract>;
