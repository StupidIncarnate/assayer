/**
 * PURPOSE: Defines the FillParamResult shape that fill-param-transformer builds
 *
 * USAGE:
 * fillParamResultContract.parse(value);
 * // Returns validated FillParamResult
 */
import { z } from "#gateway/npm/zod";
import { arrangeBindingContract } from "@assayer/shared/contracts";

export const fillParamResultContract = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("filled"), binding: arrangeBindingContract })
    .brand<"FillParamResult">(),
  z
    .object({
      kind: z.literal("unfillable"),
      param: z.string().brand<"FillParamResultParam">(),
      type: z.string().brand<"FillParamResultType">(),
    })
    .brand<"FillParamResult">(),
]);

export type FillParamResult = z.infer<typeof fillParamResultContract>;
