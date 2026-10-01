/**
 * PURPOSE: Contract for the outcome of extracting the analysis model from a source file — either
 *   the successfully extracted functions (entries with branches and exits), or a positioned parse
 *   error explaining why extraction failed (mirrors map-extract-result's error shape).
 *
 * USAGE:
 * analysisExtractResultContract.parse({ success: true, functions: [] });
 * // Returns a validated AnalysisExtractResult (discriminated on `success`)
 */
import { z } from '#gateway/npm/zod';


import { extractedFunctionContract } from '../extracted-function/extracted-function-contract';

export const analysisExtractResultContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), functions: z.array(extractedFunctionContract) }).brand<'AnalysisExtractResult'>(),
  z.object({
    success: z.literal(false),
    error: z.object({
      line: z.number().int().positive().brand<'AnalysisExtractResultErrorLine'>(),
      column: z.number().int().positive().brand<'AnalysisExtractResultErrorColumn'>(),
      message: z.string().min(1).brand<'AnalysisExtractResultErrorMessage'>(),
    }).brand<'AnalysisExtractResultError'>(),
  }).brand<'AnalysisExtractResult'>(),
]);

export type AnalysisExtractResult = z.infer<typeof analysisExtractResultContract>;
