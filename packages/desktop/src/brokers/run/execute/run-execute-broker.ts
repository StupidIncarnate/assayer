/**
 * PURPOSE: Runs one file's derived cases from the UI — by spawning the BUILT CLI and then reading
 *   the artifact it wrote.
 *
 *   It does not run anything itself, and that is the design. The plan's ruling is that there is ONE
 *   execution path: the desktop's Run spawns the same binary a human would type and reads the same
 *   artifact `assayer detail` reads. "Run in the UI" and "run headless" therefore cannot drift,
 *   because they are not two implementations — they are one CLI and two readers.
 *
 *   The exit code is not the verdict. A failing run exits 1 and that is a normal, expected outcome
 *   with a perfectly good artifact behind it; only a run that produced NO artifact is an error, and
 *   the CLI's own report is what says why.
 *
 * USAGE:
 * await runExecuteBroker({ repoPath: '/repo', root: '/repo/smoke-repo', relPath: 'src/a.ts' });
 * // Returns the saved RunResult
 */
import { runFindBroker } from '@assayer/core/brokers';
import type { RunResult } from '@assayer/shared/contracts';

import { assayerCliEntryPathAdapter } from '../../../adapters/assayer-cli/entry-path/assayer-cli-entry-path-adapter';
import { nodeChildProcessExecAdapter } from '../../../adapters/node-child-process/exec/node-child-process-exec-adapter';

export const runExecuteBroker = async ({
  repoPath,
  root,
  relPath,
}: {
  repoPath: string;
  root: string;
  relPath: string;
}): Promise<RunResult> => {
  const cliEntry = assayerCliEntryPathAdapter();

  if (cliEntry === undefined) {
    throw new Error('assayer: the CLI is not built, so nothing can be run. Build it and try again.');
  }

  const exec = await nodeChildProcessExecAdapter({
    command: process.execPath,
    args: [String(cliEntry), 'unit', relPath],
    cwd: repoPath,
  });

  const run = await runFindBroker({ configDir: repoPath, root, relPath });

  // No artifact means the run never got far enough to write one — a real failure, unlike a failing
  // CASE. The CLI already said why on stderr, so that text is the message rather than a paraphrase.
  if (run === undefined) {
    throw new Error(
      `assayer: the run produced no result for ${relPath}.\n\n${String(exec.stderr)}${String(exec.stdout)}`.trim(),
    );
  }

  return run;
};
