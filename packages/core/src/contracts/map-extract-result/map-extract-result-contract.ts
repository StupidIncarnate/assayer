/**
 * PURPOSE: Contract for the outcome of extracting a type-graph map from a source file — either
 *   the successfully extracted map nodes, or a positioned parse error explaining why extraction
 *   failed.
 *
 * USAGE:
 * mapExtractResultContract.parse({ success: true, nodes: [] });
 * // Returns a validated MapExtractResult (discriminated on `success`)
 */
import { z } from 'zod';

import { mapNodeContract, lineNumberContract } from '@assayer/shared/contracts';

export const mapExtractResultContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), nodes: z.array(mapNodeContract) }),
  z.object({
    success: z.literal(false),
    error: z.object({
      line: lineNumberContract,
      column: z.number().int().positive().brand<'ColumnNumber'>(),
      message: z.string().min(1).brand<'ExtractErrorMessage'>(),
    }),
  }),
]);

export type MapExtractResult = z.infer<typeof mapExtractResultContract>;
