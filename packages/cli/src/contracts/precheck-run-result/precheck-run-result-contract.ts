/**
 * PURPOSE: Defines the data `PrecheckRunResponder` returns
 *
 * USAGE:
 * precheckRunResultContract.parse(value);
 * // Returns validated PrecheckRunResult
 */
import { z } from "#gateway/npm/zod";
import { assayerConfigContract } from "@assayer/shared/contracts";

export const precheckRunResultContract = z
  .object({
    configDir: z.string().brand<"PrecheckRunResultConfigDir">(),
    root: z.string().brand<"PrecheckRunResultRoot">(),
    config: assayerConfigContract,
  })
  .brand<"PrecheckRunResult">();

export type PrecheckRunResult = z.infer<typeof precheckRunResultContract>;
