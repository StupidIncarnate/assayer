/**
 * PURPOSE: Branded contract for a formatted CLI error message. Format transformers (JSON parse
 *   errors, Zod validation errors, compile errors) all produce this shared shape so responders can
 *   write a single error line to stderr regardless of source.
 *
 * USAGE:
 * cliErrorMessageContract.parse('assayer.config.json: invalid JSON at line 3 column 12: ...');
 * // Returns a branded CliErrorMessage
 */
import { z } from 'zod';

export const cliErrorMessageContract = z.string().min(1).brand<'CliErrorMessage'>();

export type CliErrorMessage = z.infer<typeof cliErrorMessageContract>;
