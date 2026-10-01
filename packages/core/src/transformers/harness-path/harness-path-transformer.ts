/**
 * PURPOSE: Names the harness file COLOCATED with one source file — `src/audit.ts` is addressed by
 *   `src/audit.harness.ts`, and `src/panel.tsx` by `src/panel.harness.ts`. Always `.ts`, because a
 *   harness holds no JSX and a second extension would be a second spelling of one convention.
 *
 *   The inverse of `harness-target`, and separate from it because the two are asked at different times:
 *   the compile stitch starts from a harness and asks which source it addresses, while a run starts from
 *   a source and asks where its harness would be. Deriving one from the other in the caller is how the
 *   two ends come to disagree about which basename pairs with which.
 *
 *   It answers for any source path, whether or not that file exists — existence is the caller's read.
 *
 * USAGE:
 * harnessPathTransformer({ relPath: relPathContract.parse('src/audit.ts') });
 * // Returns 'src/audit.harness.ts'
 */

import { harnessModuleStatics } from '../../statics/harness-module/harness-module-statics';

const TS_EXTENSION = '.ts';
const TSX_EXTENSION = '.tsx';

export const harnessPathTransformer = ({ relPath }: { relPath: string }): string => {
  const path = relPath;
  const extension = path.endsWith(TSX_EXTENSION) ? TSX_EXTENSION : path.endsWith(TS_EXTENSION) ? TS_EXTENSION : '';

  return `${path.slice(0, path.length - extension.length)}${harnessModuleStatics.fileSuffix}`;
};
