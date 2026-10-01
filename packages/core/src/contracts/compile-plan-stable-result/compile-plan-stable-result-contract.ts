/**
 * PURPOSE: Defines the data `compilePlanStableBroker` returns
 *
 * USAGE:
 * compilePlanStableResultContract.parse(value);
 * // Returns validated CompilePlanStableResult
 */
import { z } from "#gateway/npm/zod";
import { compileModeContract } from "@assayer/shared/contracts";

export const compilePlanStableResultContract = z
  .object({
    mode: compileModeContract,
    targets: z.array(
      z
        .object({
          relPath: z.string().brand<"CompilePlanStableResultTargetsRelPath">(),
          content: z.string().brand<"CompilePlanStableResultTargetsContent">(),
        })
        .brand<"CompilePlanStableResultTargets">(),
    ),
    harnesses: z.array(
      z
        .object({
          relPath: z
            .string()
            .brand<"CompilePlanStableResultHarnessesRelPath">(),
          content: z
            .string()
            .brand<"CompilePlanStableResultHarnessesContent">(),
        })
        .brand<"CompilePlanStableResultHarnesses">(),
    ),
  })
  .brand<"CompilePlanStableResult">();

export type CompilePlanStableResult = z.infer<
  typeof compilePlanStableResultContract
>;
