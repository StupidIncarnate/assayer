/**
 * PURPOSE: Contract for a single-point source position — a 1-based line number paired with a
 *   1-based column number — used to pinpoint parse errors and map-node anchors.
 *
 * USAGE:
 * sourcePositionContract.parse({ line: 1, column: 1 });
 * // Returns a validated SourcePosition (branded fields)
 */
import { z } from '#gateway/npm/zod';


export const sourcePositionContract = z.object({
  line: z.number().int().positive().brand<'SourcePositionLine'>(),
  column: z.number().int().positive().brand<'SourcePositionColumn'>(),
});

export type SourcePosition = z.infer<typeof sourcePositionContract>;
