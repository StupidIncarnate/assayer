/**
 * PURPOSE: Defines the data `harnessClassifyBroker` returns
 *
 * USAGE:
 * harnessClassifyResultContract.parse(value);
 * // Returns validated HarnessClassifyResult
 */
import { z } from "#gateway/npm/zod";

export const harnessClassifyResultContract = z
  .object({
    targets: z.array(
      z
        .object({
          relPath: z.string().brand<"HarnessClassifyResultTargetsRelPath">(),
          content: z.string().brand<"HarnessClassifyResultTargetsContent">(),
        })
        .brand<"HarnessClassifyResultTargets">(),
    ),
    harnesses: z.array(
      z
        .object({
          relPath: z.string().brand<"HarnessClassifyResultHarnessesRelPath">(),
          content: z.string().brand<"HarnessClassifyResultHarnessesContent">(),
        })
        .brand<"HarnessClassifyResultHarnesses">(),
    ),
  })
  .brand<"HarnessClassifyResult">();

export type HarnessClassifyResult = z.infer<
  typeof harnessClassifyResultContract
>;
