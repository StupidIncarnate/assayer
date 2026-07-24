/**
 * PURPOSE: Saves the CLI's console text beside the run it narrates — `runs/<runId>/console.txt`, the
 *   report half of the artifact `run.json` is the data half of.
 *
 *   The report is STORED rather than re-derived because the run console must show the CLI's OWN bytes.
 *   A reader looking at a saved run in the desktop and a human who typed `assayer unit` must never be
 *   able to disagree about what happened, and the only way to guarantee that is to show the same text
 *   rather than a second telling of it. Re-formatting the artifact in the UI would be exactly that
 *   second telling, and it would drift the first time either formatter changed.
 *
 *   It keys on the SAME content-hashed `runId` the artifact does, which is what makes staleness
 *   unrepresentable rather than merely unlikely: edit the file and the id moves, so the old report is
 *   simply not found for the new bytes. There is no separate invalidation step to forget.
 *
 *   It writes into the run's OWN directory rather than owning a second location, so a run stays one
 *   directory a reader can delete whole.
 *
 * USAGE:
 * await runConsoleSaveBroker({ configDir: '/repo', runId: 'abc123', console: 'src/a.ts  1/1 passed\n' });
 * // Writes '/repo/.assayer/cache/runs/abc123/console.txt' and returns { success: true }
 */
import { fsMkdirAdapter } from '../../../adapters/fs/mkdir/fs-mkdir-adapter';
import { fsWriteFileAdapter } from '../../../adapters/fs/write-file/fs-write-file-adapter';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const runConsoleSaveBroker = async ({
  configDir,
  runId,
  console: consoleText,
}: {
  configDir: string;
  runId: string;
  console: string;
}): Promise<AdapterResult> => {
  const runDir = `${configDir}/.assayer/cache/runs/${runId}`;

  // Created rather than assumed: a file whose cases were ALL admitted never reaches the runner, so its
  // run directory may not exist yet — and the report for that run is precisely the one that says why
  // nothing ran, which is the reader's whole answer for that file.
  await fsMkdirAdapter({ path: runDir });
  await fsWriteFileAdapter({ path: `${runDir}/console.txt`, content: consoleText });

  return { success: true as const };
};
