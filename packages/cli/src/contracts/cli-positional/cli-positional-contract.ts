/**
 * PURPOSE: Branded contract for one positional argument of an assayer subcommand — a file path for
 *   `assayer unit`, a run id for `assayer detail`. It stays deliberately un-interpreted: the parser
 *   only knows argv is positional, and WHICH meaning applies is the responder's business.
 *
 * USAGE:
 * const positional = cliPositionalContract.parse('src/format-greeting.ts');
 * // Returns a validated CliPositional (branded)
 */
import { z } from 'zod';

export const cliPositionalContract = z.string().min(1).brand<'CliPositional'>();

export type CliPositional = z.infer<typeof cliPositionalContract>;
