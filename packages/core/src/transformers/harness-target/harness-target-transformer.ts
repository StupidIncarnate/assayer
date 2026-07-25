/**
 * PURPOSE: Resolves the source file one harness applies to — `src/audit.harness.ts` addresses
 *   `src/audit.ts`, and `src/panel.harness.ts` addresses `src/panel.tsx`. The harness is ALWAYS `.ts`
 *   even beside a `.tsx`, because a harness holds no JSX and a second extension would be a second
 *   spelling of one convention, so both extensions are tried against the files actually planned.
 *
 *   The answer is checked against the analysed file set rather than the disk: a harness whose target is
 *   excluded from the compile addresses nothing that will be analysed, which is the same misplacement
 *   as a target that does not exist, and the caller reports it as one.
 *
 * USAGE:
 * harnessTargetTransformer({ relPath: 'src/audit.harness.ts', sources: ['src/audit.ts'] });
 * // Returns 'src/audit.ts', or undefined when neither spelling is in the analysed set
 */
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath } from '@assayer/shared/contracts';

import { harnessModuleStatics } from '../../statics/harness-module/harness-module-statics';

const TS_EXTENSION = '.ts';
const TSX_EXTENSION = '.tsx';

export const harnessTargetTransformer = ({
  relPath,
  sources,
}: {
  relPath: RelPath;
  sources: readonly RelPath[];
}): RelPath | undefined => {
  const base = String(relPath).slice(0, -harnessModuleStatics.fileSuffix.length);
  const known = new Set(sources.map((source) => String(source)));

  return [`${base}${TS_EXTENSION}`, `${base}${TSX_EXTENSION}`]
    .filter((candidate) => known.has(candidate))
    .map((candidate) => relPathContract.parse(candidate))[0];
};
