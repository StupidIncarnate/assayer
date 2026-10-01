/**
 * PURPOSE: Loads one saved run by id — the read half of the artifact both surfaces share. The CLI's
 *   `detail` and the desktop's trace view go through here rather than each knowing the cache layout,
 *   so where a run lives stays one fact in one place.
 *
 *   Returns undefined for an unknown id rather than throwing: "no such run" is an ANSWER, and the
 *   caller is the one that knows how to say it — the CLI owes a P1-grade message naming the id, the
 *   UI owes an empty state.
 *
 * USAGE:
 * await runLoadBroker({ configDir: '/repo', runId: 'abc123' });
 * // Returns the RunResult, or undefined when no run with that id was saved
 */
import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult } from '@assayer/shared/contracts';
import { pathExists, readFile } from '#gateway/node/fs__promises';
import { fileContentsContract } from '../../../contracts/file-contents/file-contents-contract';


export const runLoadBroker = async ({
  configDir,
  runId,
}: {
  configDir: string;
  runId: string;
}): Promise<RunResult | undefined> => {
  const path = `${configDir}/.assayer/cache/runs/${runId}/run.json`;

  if (!(await pathExists(path))) {
    return undefined;
  }

  return runResultContract.parse(JSON.parse(String(fileContentsContract.parse(await readFile(path)))));
};
