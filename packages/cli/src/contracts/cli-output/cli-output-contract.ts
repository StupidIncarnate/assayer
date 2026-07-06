/**
 * PURPOSE: Branded contract for text the assayer CLI emits to stdout. Responders and the flow
 *   return this; the bin entry performs the single write.
 *
 * USAGE:
 * cliOutputContract.parse('assayer 1.0.0');
 * // Returns a branded CliOutput
 */
import { z } from 'zod';

export const cliOutputContract = z.string().min(1).brand<'CliOutput'>();

export type CliOutput = z.infer<typeof cliOutputContract>;
