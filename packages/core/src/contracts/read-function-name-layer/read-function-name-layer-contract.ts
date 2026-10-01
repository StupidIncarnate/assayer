/**
 * PURPOSE: Defines the data `readFunctionNameLayerTransformer` returns
 *
 * USAGE:
 * readFunctionNameLayerContract.parse(value);
 * // Returns validated ReadFunctionNameLayer
 */
import { z } from "#gateway/npm/zod";

export const readFunctionNameLayerContract = z
  .object({
    name: z.string().brand<"ReadFunctionNameLayerName">(),
    anonymous: z.boolean(),
  })
  .brand<"ReadFunctionNameLayer">();

export type ReadFunctionNameLayer = z.infer<
  typeof readFunctionNameLayerContract
>;
