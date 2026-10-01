/**
 * PURPOSE: Defines the data `manifestLoadBroker` returns
 *
 * USAGE:
 * manifestLoadResultContract.parse(value);
 * // Returns validated ManifestLoadResult
 */
import { z } from "#gateway/npm/zod";
import { assayerCacheManifestContract } from "@assayer/shared/contracts";

export const manifestLoadResultContract = z.discriminatedUnion("status", [
  z
    .object({ status: z.literal("ok"), manifest: assayerCacheManifestContract })
    .brand<"ManifestLoadResult">(),
  z.object({ status: z.literal("missing") }).brand<"ManifestLoadResult">(),
  z
    .object({
      status: z.literal("invalid"),
      reason: z.string().brand<"ManifestLoadResultReason">(),
    })
    .brand<"ManifestLoadResult">(),
]);

export type ManifestLoadResult = z.infer<typeof manifestLoadResultContract>;
