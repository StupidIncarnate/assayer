/**
 * PURPOSE: Defines the data `throughCallbackCasesTransformer` returns
 *
 * USAGE:
 * throughCallbackCasesContract.parse(value);
 * // Returns validated ThroughCallbackCases
 */
import { z } from "#gateway/npm/zod";
import { functionAnalysisContract } from "@assayer/shared/contracts";

export const throughCallbackCasesContract = z
  .object({
    analysis: functionAnalysisContract,
    unfillable: z.array(
      z
        .object({
          param: z.string().brand<"ThroughCallbackCasesUnfillableParam">(),
          type: z.string().brand<"ThroughCallbackCasesUnfillableType">(),
          owner: z.string().brand<"ThroughCallbackCasesUnfillableOwner">(),
        })
        .brand<"ThroughCallbackCasesUnfillable">(),
    ),
  })
  .brand<"ThroughCallbackCases">();

export type ThroughCallbackCases = z.infer<typeof throughCallbackCasesContract>;
