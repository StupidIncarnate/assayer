/**
 * PURPOSE: Executes a git subprocess and captures its exit code, stdout, and stderr —
 *   never throws or rejects on a non-zero git exit. A true spawn failure (e.g. the git
 *   binary is missing) also resolves, falling back to exit code 1 rather than rejecting.
 *
 * USAGE:
 * await gitExecAdapter({ args: ['rev-parse', 'HEAD'], cwd: '/repo' });
 * // Returns a validated GitExecResult: { exitCode, stdout, stderr }
 */
import { execFile } from 'node:child_process';

import { gitExecResultContract } from '../../../contracts/git-exec-result/git-exec-result-contract';
import type { GitExecResult } from '../../../contracts/git-exec-result/git-exec-result-contract';

export const gitExecAdapter = async ({
  args,
  cwd,
}: {
  args: readonly string[];
  cwd: string;
}): Promise<GitExecResult> =>
  new Promise((resolveResult) => {
    execFile('git', [...args], { cwd, encoding: 'utf8' }, (error, stdout, stderr) => {
      const exitCode = typeof error?.code === 'number' ? error.code : error ? 1 : 0;

      resolveResult(gitExecResultContract.parse({ exitCode, stdout, stderr }));
    });
  });
