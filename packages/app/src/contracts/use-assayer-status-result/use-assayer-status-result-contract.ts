/**
 * PURPOSE: Defines the data `useAssayerStatusBinding` returns
 *
 * USAGE:
 * useAssayerStatusResultContract.parse(value);
 * // Returns validated UseAssayerStatusResult
 */
import { z } from "#gateway/npm/zod";
import { statusViewContract } from "../status-view/status-view-contract";
import { errorSchema } from "#gateway/browser/Error";

export const useAssayerStatusResultContract = z
  .object({
    data: statusViewContract.nullable(),
    loading: z.boolean(),
    error: errorSchema.nullable(),
  })
  .brand<"UseAssayerStatusResult">();

export type UseAssayerStatusResult = z.infer<
  typeof useAssayerStatusResultContract
>;
