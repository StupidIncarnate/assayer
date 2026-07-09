/**
 * PURPOSE: Contract for a 1-based source line number (positive integer).
 *
 * USAGE:
 * const line = lineNumberContract.parse(42);
 * // Returns a validated LineNumber (branded)
 */
import { z } from 'zod';

export const lineNumberContract = z.number().int().positive().brand<'LineNumber'>();

export type LineNumber = z.infer<typeof lineNumberContract>;
