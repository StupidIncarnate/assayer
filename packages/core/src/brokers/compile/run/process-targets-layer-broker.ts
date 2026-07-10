/**
 * PURPOSE: Sequentially processes one namespace's compile-plan targets through
 *   compileProcessFileBroker, emitting an 'advanced' progress event after each file so the
 *   progress current-count stays deterministic -- the per-namespace processing unit both the
 *   stable and current phases of a compile run share.
 *
 * USAGE:
 * await processTargetsLayerBroker({
 *   remaining: [{ relPath: 'src/foo.ts', content: 'export const x = 1;\n' }],
 *   namespace: 'master', branch: 'master', blobsDir: '/repo/.assayer/cache/blobs',
 *   max: 1, stableMax: 1, currentMax: 0, current: 0, index: [], errors: [],
 * });
 * // Returns { index: [{ relPath, contentHash }], errors: [] } after writing/reusing each blob
 */
import { relPathContract } from '@assayer/shared/contracts';
import type { RelPath, ContentHash, LineNumber } from '@assayer/shared/contracts';
import type { ErrorMessage } from '@dungeonmaster/shared/contracts';

import { compileProcessFileBroker } from '../process-file/compile-process-file-broker';
import { compileProgressEventContract } from '../../../contracts/compile-progress-event/compile-progress-event-contract';
import type { CompileProgressEvent } from '../../../contracts/compile-progress-event/compile-progress-event-contract';
import type { SourcePosition } from '../../../contracts/source-position/source-position-contract';

export const processTargetsLayerBroker = async ({
  remaining,
  namespace,
  branch,
  blobsDir,
  max,
  stableMax,
  currentMax,
  current,
  index,
  errors,
  onProgress,
}: {
  remaining: { relPath: string; content: string }[];
  namespace: string;
  branch: string;
  blobsDir: string;
  max: number;
  stableMax: number;
  currentMax: number;
  current: number;
  index: { relPath: RelPath; contentHash: ContentHash }[];
  errors: { relPath: RelPath; line: LineNumber; column: SourcePosition['column']; message: ErrorMessage }[];
  onProgress?: (event: CompileProgressEvent) => void;
}): Promise<{
  index: { relPath: RelPath; contentHash: ContentHash }[];
  errors: { relPath: RelPath; line: LineNumber; column: SourcePosition['column']; message: ErrorMessage }[];
}> => {
  const [target, ...rest] = remaining;

  if (target === undefined) {
    return { index, errors };
  }

  const result = await compileProcessFileBroker({
    relPath: target.relPath,
    content: target.content,
    blobsDir,
  });
  const nextCurrent = current + 1;
  const relPath = relPathContract.parse(target.relPath);

  onProgress?.(
    compileProgressEventContract.parse({
      namespace,
      branch,
      phase: 'advanced',
      current: nextCurrent,
      max,
      stableMax,
      currentMax,
    }),
  );

  if ('error' in result) {
    return processTargetsLayerBroker({
      remaining: rest,
      namespace,
      branch,
      blobsDir,
      max,
      stableMax,
      currentMax,
      current: nextCurrent,
      index,
      errors: [
        ...errors,
        { relPath, line: result.error.line, column: result.error.column, message: result.error.message },
      ],
      ...(onProgress === undefined ? {} : { onProgress }),
    });
  }

  return processTargetsLayerBroker({
    remaining: rest,
    namespace,
    branch,
    blobsDir,
    max,
    stableMax,
    currentMax,
    current: nextCurrent,
    index: [...index, { relPath, contentHash: result.contentHash }],
    errors,
    ...(onProgress === undefined ? {} : { onProgress }),
  });
};
