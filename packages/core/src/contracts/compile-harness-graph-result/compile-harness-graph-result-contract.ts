/**
 * PURPOSE: Defines the data `compileHarnessGraphBroker` returns
 *
 * USAGE:
 * compileHarnessGraphResultContract.parse(value);
 * // Returns validated CompileHarnessGraphResult
 */
import { z } from "#gateway/npm/zod";
import { harnessIndexContract } from "@assayer/shared/contracts";

export const compileHarnessGraphResultContract = z
  .object({
    index: harnessIndexContract,
    errors: z
      .array(
        z
          .object({
            relPath: z
              .string()
              .brand<"CompileHarnessGraphResultErrorsRelPath">(),
            line: z.number().brand<"CompileHarnessGraphResultErrorsLine">(),
            column: z.number().brand<"CompileHarnessGraphResultErrorsColumn">(),
            message: z
              .string()
              .brand<"CompileHarnessGraphResultErrorsMessage">(),
          })
          .brand<"CompileHarnessGraphResultErrors">(),
      )
      .readonly(),
  })
  .brand<"CompileHarnessGraphResult">();

export type CompileHarnessGraphResult = z.infer<
  typeof compileHarnessGraphResultContract
>;
