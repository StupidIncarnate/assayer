/**
 * PURPOSE: Fetches a single compiled file view via the preload bridge adapter, keyed by its
 *   repo-relative path. Atomic broker — the seam a file-click handler calls to load a file.
 *
 * USAGE:
 * await compiledFileFetchBroker({ relPath });
 * // Returns the CompiledFileView for the requested path
 */
import { assayerBridgeGetCompiledFileAdapter } from '../../../adapters/assayer-bridge/get-compiled-file/assayer-bridge-get-compiled-file-adapter';
import type { CompiledFileView, RelPath } from '@assayer/shared/contracts';

export const compiledFileFetchBroker = async ({
  relPath,
}: {
  relPath: RelPath;
}): Promise<CompiledFileView> => assayerBridgeGetCompiledFileAdapter({ relPath });
