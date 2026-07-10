/**
 * PURPOSE: Contract for a normalized assayer CLI command — which responder handles an
 *   `assayer` invocation after its argv has been classified (help, version, docs, status,
 *   bare launch, or an unrecognized argument).
 *
 * USAGE:
 * const command = cliCommandContract.parse('help');
 * // Returns a validated CliCommand (branded)
 */
import { z } from 'zod';

export const cliCommandContract = z.enum(['help', 'version', 'docs', 'status', 'bare', 'unknown']).brand<'CliCommand'>();

export type CliCommand = z.infer<typeof cliCommandContract>;
