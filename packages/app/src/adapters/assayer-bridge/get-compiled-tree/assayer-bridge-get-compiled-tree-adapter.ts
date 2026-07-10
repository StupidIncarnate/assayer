/**
 * PURPOSE: Reads the compiled surface tree over the preload contextBridge (window.assayerBridge)
 *   and validates the raw IPC payload into the shared CompiledTree contract.
 *
 * USAGE:
 * await assayerBridgeGetCompiledTreeAdapter();
 * // Returns a validated CompiledTree from the desktop main process
 */
import { compiledTreeContract } from '@assayer/shared/contracts';
import type { CompiledTree } from '@assayer/shared/contracts';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const assayerBridgeGetCompiledTreeAdapter = async (): Promise<CompiledTree> => {
  const bridge = window.assayerBridge;

  if (bridge?.getCompiledTree === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getCompiledTree();

  return compiledTreeContract.parse(raw);
};
