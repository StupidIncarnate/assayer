/**
 * PURPOSE: Fetches the compiled surface tree via the preload bridge adapter. Atomic broker — the
 *   single seam the compiled-tree binding subscribes to.
 *
 * USAGE:
 * await compiledTreeFetchBroker();
 * // Returns the CompiledTree from the desktop main process
 */
import { assayerBridgeGetCompiledTreeAdapter } from '../../../adapters/assayer-bridge/get-compiled-tree/assayer-bridge-get-compiled-tree-adapter';
import type { CompiledTree } from '@assayer/shared/contracts';

export const compiledTreeFetchBroker = async (): Promise<CompiledTree> =>
  assayerBridgeGetCompiledTreeAdapter();
