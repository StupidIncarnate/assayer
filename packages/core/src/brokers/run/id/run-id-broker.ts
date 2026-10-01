/**
 * PURPOSE: Derives a run's id from the file it runs — the ONE place that decides what names a run.
 *
 *   It exists on its own because two callers need the same answer and must not each compute it: the
 *   runner names the directory it writes, and every reader (a saved status in the UI, a detail link)
 *   has to find that directory again knowing only the file. Two derivations of one id is two
 *   encodings of one concept, and they drift silently — the reader simply finds nothing and reports
 *   "never run" over a run that happened.
 *
 *   Keyed on relPath AND content: the path alone would collide across edits, so a stale run would
 *   answer for new code; the content alone would collide across files that happen to read the same.
 *
 *   And keyed on the colocated HARNESS, because a harness is a second input to every case's RESULT:
 *   the values it supplies are the arguments the entry actually runs on, so editing one changes what
 *   the same bytes do. Discovery is the same conjunction every other harness reader uses — the
 *   colocated basename plus the symbol gate — so a `*.harness.ts` that is some other tool's moves no
 *   id, and a file with NO harness keys exactly as it always has: an absent ingredient contributes
 *   nothing rather than a constant, which is what keeps every saved run of an unharnessed file valid.
 *   The ingredient is a digest of the harness's own bytes, the same one the compile stitch folds into
 *   the harness index for the same reason — neither the layout hash nor the tsconfig hash moves when a
 *   file classified OUT of the analysed surface is edited.
 *
 * USAGE:
 * await runIdBroker({ root: '/repo', relPath: 'src/a.ts', source: 'export const a = 1;\n' });
 * // Returns a RunId — the same one, for the same bytes and the same harness, forever
 */
import { relPathContract, runIdContract } from '@assayer/shared/contracts';
import type { RunId } from '@assayer/shared/contracts';

import { contentHashTransformer } from '../../../transformers/content-hash/content-hash-transformer';
import { fsExistsAdapter } from '../../../adapters/fs/exists/fs-exists-adapter';
import { fsReadFileAdapter } from '../../../adapters/fs/read-file/fs-read-file-adapter';
import { isAssayerHarnessGuard } from '../../../guards/is-assayer-harness/is-assayer-harness-guard';
import { harnessPathTransformer } from '../../../transformers/harness-path/harness-path-transformer';

export const runIdBroker = async ({
  root,
  relPath,
  source,
}: {
  root: string;
  relPath: string;
  source: string;
}): Promise<RunId> => {
  const harnessPath = `${root}/${String(harnessPathTransformer({ relPath: relPathContract.parse(relPath) }))}`;
  const harnessSource = (await fsExistsAdapter({ path: harnessPath }))
    ? String(await fsReadFileAdapter({ path: harnessPath }))
    : undefined;
  const harnessDigest =
    harnessSource !== undefined && isAssayerHarnessGuard({ source: harnessSource })
      ? String(contentHashTransformer({ content: harnessSource }))
      : undefined;

  return runIdContract.parse(
    String(
      contentHashTransformer({
        content:
          harnessDigest === undefined ? `${relPath}\n${source}` : `${relPath}\n${source}\n${harnessDigest}`,
      }),
    ),
  );
};
