/**
 * PURPOSE: Wraps node:child_process spawn to run a command to COMPLETION and report how it went —
 *   exit code plus captured output.
 *
 *   It is a second spawn adapter rather than a flag on the first because the two are structurally
 *   different, not configurably different: the launcher spawns `detached` with `stdio: 'ignore'` and
 *   unrefs, so the CLI can exit while the window lives on — it cannot await anything, by design.
 *   This one must await, because the caller has to know the run happened before it reads the
 *   artifact.
 *
 *   stderr is captured, not forwarded: a failing `assayer unit` writes its REPORT there, and that
 *   text is product surface the UI renders — not console noise for whoever launched Electron.
 *
 * USAGE:
 * await nodeChildProcessExecAdapter({ command: 'node', args: ['assayer.js', 'unit', 'src/a.ts'], cwd: '/repo' });
 * // Returns { exitCode: 0, stdout: '…', stderr: '' } once the process has exited
 */
import { spawn } from 'node:child_process';

import { execResultContract } from '../../../contracts/exec-result/exec-result-contract';
import type { ExecResult } from '../../../contracts/exec-result/exec-result-contract';

export const nodeChildProcessExecAdapter = async ({
  command,
  args,
  cwd,
}: {
  command: string;
  args: readonly string[];
  cwd: string;
}): Promise<ExecResult> =>
  new Promise((resolve: (result: ExecResult) => void, reject: (error: Error) => void) => {
    const child = spawn(command, [...args], { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';

    child.stdout.on('data', (chunk: Buffer) => {
      out += String(chunk);
    });
    child.stderr.on('data', (chunk: Buffer) => {
      err += String(chunk);
    });
    child.on('error', reject);
    child.on('close', (code: number | null) => {
      // A null code means killed by a signal — a failure the caller must not read as success.
      resolve(execResultContract.parse({ exitCode: code ?? 1, stdout: out, stderr: err }));
    });
  });
