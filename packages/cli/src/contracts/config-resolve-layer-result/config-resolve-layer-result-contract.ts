/**
 * PURPOSE: Defines the data `ConfigResolveLayerResponder` returns
 *
 * USAGE:
 * configResolveLayerResultContract.parse(value);
 * // Returns validated ConfigResolveLayerResult
 */
import { z } from "#gateway/npm/zod";
import { assayerConfigContract } from "@assayer/shared/contracts";

export const configResolveLayerResultContract = z
  .object({
    config: assayerConfigContract,
    configDir: z.string().brand<"ConfigResolveLayerResultConfigDir">(),
    configPath: z.string().brand<"ConfigResolveLayerResultConfigPath">(),
  })
  .brand<"ConfigResolveLayerResult">();

export type ConfigResolveLayerResult = z.infer<
  typeof configResolveLayerResultContract
>;
