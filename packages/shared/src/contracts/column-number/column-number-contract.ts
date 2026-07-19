/**
 * PURPOSE: Contract for a 1-based source column number (positive integer) — pairs with a line
 *   number to pinpoint a single position in source (parse errors, module references, map anchors).
 *
 * USAGE:
 * const column = columnNumberContract.parse(10);
 * // Returns a validated ColumnNumber (branded)
 */
import { z } from 'zod';

export const columnNumberContract = z.number().int().positive().brand<'ColumnNumber'>();

export type ColumnNumber = z.infer<typeof columnNumberContract>;
