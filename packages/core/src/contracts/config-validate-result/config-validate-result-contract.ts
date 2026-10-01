/**
 * PURPOSE: Defines the data `configValidateBroker` returns
 *
 * USAGE:
 * configValidateResultContract.parse(value);
 * // Returns validated ConfigValidateResult
 */
import { z } from "#gateway/npm/zod";
import { assayerConfigContract } from "@assayer/shared/contracts";

export const configValidateResultContract = z.discriminatedUnion("success", [
  z
    .object({ success: z.literal(true), config: assayerConfigContract })
    .brand<"ConfigValidateResult">(),
  z
    .object({
      success: z.literal(false),
      issues: z.array(
        z
          .object({
            path: z.string().brand<"ConfigValidateResultIssuesPath">(),
            message: z.string().brand<"ConfigValidateResultIssuesMessage">(),
          })
          .brand<"ConfigValidateResultIssues">(),
      ),
    })
    .brand<"ConfigValidateResult">(),
]);

export type ConfigValidateResult = z.infer<typeof configValidateResultContract>;
