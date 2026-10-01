/**
 * PURPOSE: Finds the saved console report for a FILE, if one exists — how a reader answers "what did
 *   the last run of this file SAY" knowing only the path.
 *
 *   It is the report twin of `run-find-broker` and derives its id the same way, through `runIdBroker`,
 *   so the reader and the writer cannot disagree about where a run's text lives. Reading the file to
 *   do that is the point: the id is keyed on every INPUT to the run, so a report saved against edited
 *   source — or against a harness that has since changed — is correctly not found. The panel wipes by
 *   the same mechanism the verdicts do, rather than by a second invalidation rule that could drift
 *   from the first.
 *
 *   Undefined means "no report" — a file nobody has run, or one whose inputs have moved on. That is an
 *   answer, not an error, and it is what tells the desktop to show no console rather than a stale one.
 *
 * USAGE:
 * await runConsoleFindBroker({ configDir: '/repo', root: '/repo/smoke-repo', relPath: 'src/a.ts' });
 * // Returns the RunConsole for the file's CURRENT bytes, or undefined
 */
import { runConsoleContract } from '@assayer/shared/contracts';
import type { RunConsole } from '@assayer/shared/contracts';

import { runIdBroker } from '../id/run-id-broker';
import { pathExists, readFile } from '#gateway/node/fs__promises';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';

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

  if (!(await pathExists(absPath))) {
    return undefined;
  }

  const source = String(fileContentsContract.parse(await readFile(absPath)));
  const runId = String(await runIdBroker({ root, relPath, source }));
  const path = `${configDir}/.assayer/cache/runs/${runId}/console.txt`;

  if (!(await pathExists(path))) {
    return undefined;
  }

  return runConsoleContract.parse(String(fileContentsContract.parse(await readFile(path))));
};
