/**
 * PURPOSE: Contract for the captured result of spawning the built assayer CLI as a child process —
 *   its collected stdout, its collected stderr, and its numeric exit code. Consumed by the
 *   integration harness that walks the CLI precheck flow end-to-end against the real binary.
 *
 * USAGE:
 * cliRunResultContract.parse({ stdout: 'assayer 1.0.0\n', stderr: '', exitCode: 0 });
 * // Returns a validated CliRunResult (branded fields)
 */
import { z } from 'zod';

export const cliRunResultContract = z.object({
  stdout: z.string().brand<'CliRunStdout'>(),
  stderr: z.string().brand<'CliRunStderr'>(),
  exitCode: z.number().int().brand<'CliRunExitCode'>(),
});

export type CliRunResult = z.infer<typeof cliRunResultContract>;
