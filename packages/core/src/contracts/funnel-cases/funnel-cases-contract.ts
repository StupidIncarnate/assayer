/**
 * PURPOSE: Defines the data `funnelCasesTransformer` returns
 *
 * USAGE:
 * funnelCasesContract.parse(value);
 * // Returns validated FunnelCases
 */
import { z } from "#gateway/npm/zod";
import { derivedTestCaseContract } from "@assayer/shared/contracts";

export const funnelCasesContract = z
  .object({
    cases: z.array(derivedTestCaseContract),
    unfillable: z.array(
      z
        .object({
          param: z.string().brand<"FunnelCasesUnfillableParam">(),
          type: z.string().brand<"FunnelCasesUnfillableType">(),
          owner: z.string().brand<"FunnelCasesUnfillableOwner">(),
        })
        .brand<"FunnelCasesUnfillable">(),
    ),
  })
  .brand<"FunnelCases">();

export type FunnelCases = z.infer<typeof funnelCasesContract>;
