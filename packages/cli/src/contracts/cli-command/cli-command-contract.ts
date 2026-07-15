/**
 * PURPOSE: Contract for a normalized assayer CLI command — which responder handles an
 *   `assayer` invocation after its argv has been classified (help, version, docs, status, unit,
 *   detail, bare launch, or an unrecognized argument).
 *
 *   `unit` runs the derived cases; `detail` prints one saved run. There is deliberately no `run`
 *   verb — the execution verbs are named for WHAT they execute, so `unit` and a later `e2e` read as
 *   the same kind of thing rather than as one generic escape hatch.
 *
 * USAGE:
 * const command = cliCommandContract.parse('help');
 * // Returns a validated CliCommand (branded)
 */
import { z } from 'zod';

export const cliCommandContract = z
  .enum(['help', 'version', 'docs', 'status', 'unit', 'detail', 'bare', 'unknown'])
  .brand<'CliCommand'>();

export type CliCommand = z.infer<typeof cliCommandContract>;
