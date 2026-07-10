/**
 * PURPOSE: Reads a single compiled file view over the preload contextBridge (window.assayerBridge)
 *   and validates the raw IPC payload into the shared CompiledFileView contract.
 *
 * USAGE:
 * await assayerBridgeGetCompiledFileAdapter({ relPath });
 * // Returns a validated CompiledFileView for the requested repo-relative path
 */
import { compiledFileViewContract } from '@assayer/shared/contracts';
import type { CompiledFileView, RelPath } from '@assayer/shared/contracts';

import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const assayerBridgeGetCompiledFileAdapter = async ({
  relPath,
}: {
  relPath: RelPath;
}): Promise<CompiledFileView> => {
  const bridge = window.assayerBridge;

  if (bridge?.getCompiledFile === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getCompiledFile({ relPath });

  return compiledFileViewContract.parse(raw);
};
