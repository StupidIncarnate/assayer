/**
 * PURPOSE: Defines the data `inputBucketsTransformer` returns
 *
 * USAGE:
 * inputBucketsContract.parse(value);
 * // Returns validated InputBuckets
 */
import { z } from "#gateway/npm/zod";
import { conditionCauseContract } from "../condition-cause/condition-cause-contract";
import { guardStepContract } from "@assayer/shared/contracts";

export const inputBucketsContract = z.array(
  z
    .object({
      requirements: conditionCauseContract.shape.requirements,
      arms: z.array(guardStepContract),
      predWant: z.boolean().optional(),
    })
    .brand<"InputBuckets">(),
);

export type InputBuckets = z.infer<typeof inputBucketsContract>;
