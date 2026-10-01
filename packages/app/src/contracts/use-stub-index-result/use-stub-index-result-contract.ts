/**
 * PURPOSE: Defines the data `useStubIndexBinding` returns
 *
 * USAGE:
 * useStubIndexResultContract.parse(value);
 * // Returns validated UseStubIndexResult
 */
import { z } from "#gateway/npm/zod";
import { stubViewContract } from "@assayer/shared/contracts";
import { errorSchema } from "#gateway/browser/Error";

export const useStubIndexResultContract = z
  .object({
    data: stubViewContract.nullable(),
    loading: z.boolean(),
    error: errorSchema.nullable(),
  })
  .brand<"UseStubIndexResult">();

export type UseStubIndexResult = z.infer<typeof useStubIndexResultContract>;
