/**
 * PURPOSE: Projects a file's owning-tsconfig options down to the options the hermetic walk and the harness type
 *   reader run with: only the options in `analysisOptionsStatics.analysis`, with `analysisOptionsStatics.forced`
 *   set on top. Reach for this before any hermetic parse and before keying a cache entry on a file's analysis, so
 *   both see one option set. A file no tsconfig owns passes `{}` and gets TypeScript's defaults plus the forced
 *   options. Projecting an already-projected set returns the same set.
 *
 * USAGE:
 * analysisOptionsTransformer({ options: { target: 9, strict: true, outDir: '/repo/dist' } });
 * // Returns { target: 9, strict: true, strictNullChecks: true }
 */
import type { CompilerOptions } from '#gateway/npm/typescript';

import { analysisOptionsStatics } from '../../statics/analysis-options/analysis-options-statics';

export const analysisOptionsTransformer = ({ options }: { options: CompilerOptions }): CompilerOptions => ({
  ...Object.fromEntries(
    analysisOptionsStatics.analysis.flatMap((name) => (options[name] === undefined ? [] : [[name, options[name]]])),
  ),
  ...analysisOptionsStatics.forced,
});
