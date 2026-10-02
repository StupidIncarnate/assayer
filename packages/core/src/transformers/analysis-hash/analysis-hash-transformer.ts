/**
 * PURPOSE: The per-file cache key: one SHA-256 over a file's bytes AND the analysis options it is walked under.
 *   Reach for this to name a file's compiled blob. `contentHash` answers only "did the bytes change"; this answers
 *   "would the walk come out differently", so editing the `lib`, `target` or a strict flag of the tsconfig that
 *   owns a file gives that file a new blob, and leaves every other file's blob where it is. `options` are the
 *   owner's options as `tsconfigOwnerBroker` returns them; the same projection the walk applies is applied here,
 *   so an option the walk ignores never moves the key.
 *
 * USAGE:
 * analysisHashTransformer({ content: 'export const a = 1;\n', options: { target: 9, outDir: '/repo/dist' } });
 * // Returns the ContentHash of '[["strictNullChecks",true],["target",9]]\nexport const a = 1;\n'
 */
import type { CompilerOptions } from '#gateway/npm/typescript';
import type { ContentHash } from '@assayer/shared/contracts';

import { analysisOptionsTransformer } from '../analysis-options/analysis-options-transformer';
import { compilerOptionsKeyTransformer } from '../compiler-options-key/compiler-options-key-transformer';
import { contentHashTransformer } from '../content-hash/content-hash-transformer';

export const analysisHashTransformer = ({
  content,
  options,
}: {
  content: string;
  options: CompilerOptions;
}): ContentHash =>
  contentHashTransformer({
    content: `${compilerOptionsKeyTransformer({ options: analysisOptionsTransformer({ options }) })}\n${content}`,
  });
