/**
 * PURPOSE: The ONE place a planned file is decided to be an Assayer harness or ordinary source. It
 *   applies the two-part rule — the `*.harness.ts` suffix names WHICH source file a harness applies to,
 *   and the imported-and-called `assayerHarness` symbol decides WHETHER the file is one at all — and
 *   splits the plan into the targets that get analysed and the harnesses that go to the harness stitch.
 *
 *   A real harness leaves the analysed surface because it is not the repo's code: it declares inputs for
 *   the file beside it, and analysing it would invoice a reader for the very values it supplies. Every
 *   other `*.harness.ts` — a Playwright fixture, a Jest harness, a consumer's own file that merely wears
 *   the name — stays an ordinary target and is analysed like anything else. That is why the exclusion
 *   lives here and not in the source-inclusion guard: a blanket `.harness.` rule would silently drop a
 *   consumer's real source.
 *
 *   Classifying in one place is what keeps the compiler, the catalogue walk and the surface e2e agreeing
 *   about what the analysed surface contains; each file is gated exactly once, so the answer cannot
 *   differ by who asked.
 *
 * USAGE:
 * harnessClassifyBroker({ files: [{ relPath, content }, ...] });
 * // Returns { targets: [...], harnesses: [...] } — the same entries, partitioned
 */

import { harnessClassifyResultContract } from '../../../contracts/harness-classify-result/harness-classify-result-contract';
import type { HarnessClassifyResult } from '../../../contracts/harness-classify-result/harness-classify-result-contract';
import { isAssayerHarnessGuard } from '../../../guards/is-assayer-harness/is-assayer-harness-guard';
import { harnessModuleStatics } from '../../../statics/harness-module/harness-module-statics';

export const harnessClassifyBroker = ({
  files,
}: {
  files: readonly { relPath: string; content: string }[];
}): HarnessClassifyResult => {
  const classified = files.map((file) => ({
    file: { relPath: file.relPath, content: file.content },
    isHarness:
      String(file.relPath).endsWith(harnessModuleStatics.fileSuffix) &&
      isAssayerHarnessGuard({ source: String(file.content) }),
  }));

  return harnessClassifyResultContract.parse({
    targets: classified.filter((entry) => !entry.isHarness).map((entry) => entry.file),
    harnesses: classified.filter((entry) => entry.isHarness).map((entry) => entry.file),
  });
};
