/**
 * PURPOSE: Contract for the raw result of executing a git subprocess — exit code plus captured
 *   stdout/stderr, before any interpretation of success or failure.
 *
 * USAGE:
 * gitExecResultContract.parse({ exitCode: 0, stdout: 'abc123\n', stderr: '' });
 * // Returns a validated GitExecResult (branded fields)
 */
import { z } from '#gateway/npm/zod';

export const gitExecResultContract = z.object({
  exitCode: z.number().int().brand<'GitExecResultExitCode'>(),
  stdout: z.string().brand<'GitExecResultStdout'>(),
  stderr: z.string().brand<'GitExecResultStderr'>(),
}).brand<'GitExecResult'>();

export type GitExecResult = z.infer<typeof gitExecResultContract>;
