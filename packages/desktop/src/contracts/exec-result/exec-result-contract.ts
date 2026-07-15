/**
 * PURPOSE: Contract for the captured result of running a command to completion — the exit code plus
 *   whatever it wrote.
 *
 *   The exit code is the whole reason this exists: the desktop's launcher spawns detached and can
 *   never know how a process ended, but a Run action must know whether the run happened before it
 *   goes looking for the artifact.
 *
 *   `stderr` is captured rather than forwarded because a failing `assayer unit` writes its REPORT
 *   there — product surface the UI renders, not console noise.
 *
 * USAGE:
 * execResultContract.parse({ exitCode: 0, stdout: 'src/a.ts  3/3 passed', stderr: '' });
 * // Returns a validated ExecResult (branded fields)
 */
import { z } from 'zod';

export const execResultContract = z.object({
  exitCode: z.number().int().brand<'ExitCode'>(),
  stdout: z.string().brand<'ExecStdout'>(),
  stderr: z.string().brand<'ExecStderr'>(),
});

export type ExecResult = z.infer<typeof execResultContract>;
