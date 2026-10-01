/**
 * PURPOSE: Finds the saved run for a FILE, if one exists — how any reader answers "has this been run,
 *   and what happened" knowing only the path.
 *
 *   It derives the id through `runIdBroker`, the same broker the runner names its directory with, so
 *   the reader and the writer cannot disagree about where a run lives. It reads the file to do that,
 *   which is the point: the id is keyed on every INPUT to the run's result — the source and the
 *   colocated harness alike — so a run saved against edited source, or against a harness that has
 *   since changed what it supplies, is correctly not found. "Stale" is unrepresentable rather than
 *   merely unlikely.
 *
 *   Undefined means "not run" — an answer, not an error.
 *
 * USAGE:
 * await runFindBroker({ configDir: '/repo', root: '/repo/smoke-repo', relPath: 'src/a.ts' });
 * // Returns the RunResult for the file's CURRENT bytes, or undefined
 */
import type { RunResult } from '@assayer/shared/contracts';

import { runIdBroker } from '../id/run-id-broker';
import { runLoadBroker } from '../load/run-load-broker';
import { pathExists, readFile } from '#gateway/node/fs__promises';

export const runFindBroker = async ({
  configDir,
  root,
  relPath,
}: {
  configDir: string;
  root: string;
  relPath: string;
}): Promise<RunResult | undefined> => {
  const absPath = `${root}/${relPath}`;

  if (!(await pathExists(absPath))) {
    return undefined;
  }

  const source = String((await readFile(absPath)));

  return runLoadBroker({ configDir, runId: String(await runIdBroker({ root, relPath, source })) });
};
