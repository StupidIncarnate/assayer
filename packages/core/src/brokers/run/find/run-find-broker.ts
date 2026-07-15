/**
 * PURPOSE: Finds the saved run for a FILE, if one exists — how any reader answers "has this been run,
 *   and what happened" knowing only the path.
 *
 *   It derives the id through `runIdBroker`, the same broker the runner names its directory with, so
 *   the reader and the writer cannot disagree about where a run lives. It reads the file to do that,
 *   which is the point: the id is keyed on CONTENT, so a run saved against edited source is
 *   correctly not found — "stale" is unrepresentable rather than merely unlikely.
 *
 *   Undefined means "not run" — an answer, not an error.
 *
 * USAGE:
 * await runFindBroker({ configDir: '/repo', root: '/repo/smoke-repo', relPath: 'src/a.ts' });
 * // Returns the RunResult for the file's CURRENT bytes, or undefined
 */
import type { RunResult } from '@assayer/shared/contracts';

import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { runIdBroker } from '../id/run-id-broker';
import { runLoadBroker } from '../load/run-load-broker';

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

  if (!(await fsExistsAdapter({ path: absPath }))) {
    return undefined;
  }

  const source = String(await fsReadFileAdapter({ path: absPath }));

  return runLoadBroker({ configDir, runId: String(runIdBroker({ relPath, source })) });
};
