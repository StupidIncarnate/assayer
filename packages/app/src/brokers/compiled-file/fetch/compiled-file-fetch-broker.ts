/**
 * PURPOSE: Fetches a single compiled file view via the preload bridge adapter, keyed by its
 *   repo-relative path. Atomic broker — the seam a file-click handler calls to load a file.
 *
 * USAGE:
 * await compiledFileFetchBroker({ relPath });
 * // Returns the CompiledFileView for the requested path
 */
import type { CompiledFileView } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { compiledFileViewContract } from '@assayer/shared/contracts';

export const compiledFileFetchBroker = async ({
  relPath,
}: {
  relPath: string;
}): Promise<CompiledFileView> => {
  const bridge = window.assayerBridge;

  if (bridge?.getCompiledFile === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getCompiledFile({ relPath });

  return compiledFileViewContract.parse(raw);
};
