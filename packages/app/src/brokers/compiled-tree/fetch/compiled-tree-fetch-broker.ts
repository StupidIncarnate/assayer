/**
 * PURPOSE: Fetches the compiled surface tree via the preload bridge adapter. Atomic broker — the
 *   single seam the compiled-tree binding subscribes to.
 *
 * USAGE:
 * await compiledTreeFetchBroker();
 * // Returns the CompiledTree from the desktop main process
 */
import type { CompiledTree } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { compiledTreeContract } from '@assayer/shared/contracts';

export const compiledTreeFetchBroker = async (): Promise<CompiledTree> => {
  const bridge = window.assayerBridge;

  if (bridge?.getCompiledTree === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getCompiledTree();

  return compiledTreeContract.parse(raw);
};
