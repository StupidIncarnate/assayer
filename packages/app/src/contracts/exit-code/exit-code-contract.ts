/**
 * PURPOSE: Contract for a child process exit code — the numeric status a spawned process reports
 *   on exit (0 for success, non-zero for failure).
 *
 * USAGE:
 * const code = exitCodeContract.parse(0);
 * // Returns a validated ExitCode (branded)
 */
import { z } from 'zod';

export const exitCodeContract = z.number().int().min(0).brand<'ExitCode'>();

export type ExitCode = z.infer<typeof exitCodeContract>;
