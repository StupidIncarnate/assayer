/**
 * PURPOSE: Finds the saved console report for a FILE, if one exists — how a reader answers "what did
 *   the last run of this file SAY" knowing only the path.
 *
 *   It is the report twin of `run-find-broker` and derives its id the same way, through `runIdBroker`,
 *   so the reader and the writer cannot disagree about where a run's text lives. Reading the file to
 *   do that is the point: the id is keyed on CONTENT, so a report saved against edited source is
 *   correctly not found — the panel wipes on an edit by the same mechanism the verdicts do, rather
 *   than by a second invalidation rule that could drift from the first.
 *
 *   Undefined means "no report" — a file nobody has run, or one whose bytes have moved on. That is an
 *   answer, not an error, and it is what tells the desktop to show no console rather than a stale one.
 *
 * USAGE:
 * await runConsoleFindBroker({ configDir: '/repo', root: '/repo/smoke-repo', relPath: 'src/a.ts' });
 * // Returns the RunConsole for the file's CURRENT bytes, or undefined
 */
import { runConsoleContract } from '@assayer/shared/contracts';
import type { RunConsole } from '@assayer/shared/contracts';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { runIdBroker } from '../id/run-id-broker';

export const runConsoleFindBroker = async ({
  configDir,
  root,
  relPath,
}: {
  configDir: string;
  root: string;
  relPath: string;
}): Promise<RunConsole | undefined> => {
  const absPath = `${root}/${relPath}`;

  if (!(await fsExistsAdapter({ path: absPath }))) {
    return undefined;
  }

  const source = String(await fsReadFileAdapter({ path: absPath }));
  const path = `${configDir}/.assayer/cache/runs/${String(runIdBroker({ relPath, source }))}/console.txt`;

  if (!(await fsExistsAdapter({ path }))) {
    return undefined;
  }

  return runConsoleContract.parse(String(await fsReadFileAdapter({ path })));
};
