/**
 * PURPOSE: Defines the data `useCompiledTreeBinding` returns
 *
 * USAGE:
 * useCompiledTreeResultContract.parse(value);
 * // Returns validated UseCompiledTreeResult
 */
import { z } from "#gateway/npm/zod";
import { compiledTreeContract } from "@assayer/shared/contracts";
import { errorSchema } from "#gateway/browser/Error";

export const useCompiledTreeResultContract = z
  .object({
    data: compiledTreeContract.nullable(),
    loading: z.boolean(),
    error: errorSchema.nullable(),
  })
  .brand<"UseCompiledTreeResult">();

export type UseCompiledTreeResult = z.infer<
  typeof useCompiledTreeResultContract
>;
