/**
 * PURPOSE: Defines the data `harnessValidateTransformer` returns
 *
 * USAGE:
 * harnessValidateContract.parse(value);
 * // Returns validated HarnessValidate
 */
import { z } from "#gateway/npm/zod";

export const harnessValidateContract = z
  .array(
    z
      .object({
        relPath: z.string().brand<"HarnessValidateRelPath">(),
        line: z.number().brand<"HarnessValidateLine">(),
        column: z.number().brand<"HarnessValidateColumn">(),
        message: z.string().brand<"HarnessValidateMessage">(),
      })
      .brand<"HarnessValidate">(),
  )
  .readonly();

export type HarnessValidate = z.infer<typeof harnessValidateContract>;
