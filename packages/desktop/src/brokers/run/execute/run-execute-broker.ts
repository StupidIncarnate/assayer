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
 *   `onOutput` streams the CLI's console output as it is written, so the UI can show the same report a
 *   human reading a terminal sees, while it is still being written rather than only once it is done.
 *
 * USAGE:
 * await runExecuteBroker({ repoPath: '/repo', root: '/repo/smoke-repo', relPath: 'src/a.ts' });
 * // Returns the saved RunResult
 */
import { runFindBroker } from '@assayer/core/brokers';
import type { RunResult } from '@assayer/shared/contracts';
import { run } from '#gateway/node/child_process';
import { findUpSync } from '#gateway/node/fs';
import { join } from '#gateway/node/path';
import { execPath } from '#gateway/node/process';

import { execResultContract } from '../../../contracts/exec-result/exec-result-contract';

export const runExecuteBroker = async ({
  repoPath,
  root,
  relPath,
  onOutput,
}: {
  repoPath: string;
  root: string;
  relPath: string;
  onOutput?: (params: { chunk: string }) => void;
}): Promise<RunResult> => {
  // Walks up from this module to the nearest ancestor holding the built CLI, because this module runs
  // from both src and dist and a counted `../..` would shift between them. The CLI is found by path:
  // desktop cannot import it, since the CLI already depends on desktop.
  const cliEntry = findUpSync({
    startDir: __dirname,
    fileName: join('packages', 'cli', 'dist', 'bin', 'assayer.js'),
  });

  if (cliEntry === null) {
    throw new Error('assayer: the CLI is not built, so nothing can be run. Build it and try again.');
  }

  // In the Electron main process `process.execPath` is the ELECTRON binary, not node — so handing it
  // a script path launches a second Electron APP that never exits, hanging this await forever.
  // ELECTRON_RUN_AS_NODE makes that same binary behave as plain node, which is what the CLI needs.
  // stdout and stderr share one callback: the CLI writes progress to stdout and its report to stderr,
  // and a reader watching one stream would miss half the run.
  const exec = execResultContract.parse(
    await run({
      command: execPath,
      args: [cliEntry, 'unit', relPath],
      cwd: repoPath,
      env: { ELECTRON_RUN_AS_NODE: '1' },
      stdin: 'ignore',
      onStdout: (chunk) => onOutput?.({ chunk }),
      onStderr: (chunk) => onOutput?.({ chunk }),
    }),
  );

  const savedRun = await runFindBroker({ configDir: repoPath, root, relPath });

  // No artifact means the run never got far enough to write one — a real failure, unlike a failing
  // CASE. The CLI already said why on stderr, so that text is the message rather than a paraphrase.
  if (savedRun === undefined) {
    throw new Error(
      `assayer: the run produced no result for ${relPath}.\n\n${String(exec.stderr)}${String(exec.stdout)}`.trim(),
    );
  }

  return savedRun;
};
