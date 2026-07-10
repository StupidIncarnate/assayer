/**
 * PURPOSE: Contract for the raw result of executing a git subprocess — exit code plus captured
 *   stdout/stderr, before any interpretation of success or failure.
 *
 * USAGE:
 * gitExecResultContract.parse({ exitCode: 0, stdout: 'abc123\n', stderr: '' });
 * // Returns a validated GitExecResult (branded fields)
 */
import { z } from 'zod';

export const gitExecResultContract = z.object({
  exitCode: z.number().int().brand<'GitExitCode'>(),
  stdout: z.string().brand<'GitStdout'>(),
  stderr: z.string().brand<'GitStderr'>(),
});

export type GitExecResult = z.infer<typeof gitExecResultContract>;
