/**
 * PURPOSE: Defines the data `compileResolveGraphBroker` returns
 *
 * USAGE:
 * compileResolveGraphResultContract.parse(value);
 * // Returns validated CompileResolveGraphResult
 */
import { z } from "#gateway/npm/zod";
import { resolvedIndexContract } from "@assayer/shared/contracts";

export const compileResolveGraphResultContract = z
  .object({
    index: resolvedIndexContract,
    errors: z.array(
      z
        .object({
          relPath: z.string().brand<"CompileResolveGraphResultErrorsRelPath">(),
          line: z.number().brand<"CompileResolveGraphResultErrorsLine">(),
          column: z.number().brand<"CompileResolveGraphResultErrorsColumn">(),
          message: z.string().brand<"CompileResolveGraphResultErrorsMessage">(),
        })
        .brand<"CompileResolveGraphResultErrors">(),
    ),
  })
  .brand<"CompileResolveGraphResult">();

export type CompileResolveGraphResult = z.infer<
  typeof compileResolveGraphResultContract
>;
