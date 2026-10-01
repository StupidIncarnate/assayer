/**
 * PURPOSE: Contract for the outcome of extracting a type-graph map from a source file — either
 *   the successfully extracted map nodes, or a positioned parse error explaining why extraction
 *   failed.
 *
 * USAGE:
 * mapExtractResultContract.parse({ success: true, nodes: [] });
 * // Returns a validated MapExtractResult (discriminated on `success`)
 */
import { z } from '#gateway/npm/zod';

import { mapNodeContract } from '@assayer/shared/contracts';

import { sourcePositionContract } from '../source-position/source-position-contract';

export const mapExtractResultContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), nodes: z.array(mapNodeContract) }).brand<'MapExtractResult'>(),
  z.object({
    success: z.literal(false),
    error: z.object({
      line: sourcePositionContract.shape.line,
      column: sourcePositionContract.shape.column,
      message: z.string().min(1).brand<'MapExtractResultErrorMessage'>(),
    }).brand<'MapExtractResultError'>(),
  }).brand<'MapExtractResult'>(),
]);

export type MapExtractResult = z.infer<typeof mapExtractResultContract>;
