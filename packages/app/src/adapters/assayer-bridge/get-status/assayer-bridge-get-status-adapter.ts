/**
 * PURPOSE: Reads the assayer status over the preload contextBridge (window.assayerBridge) and
 *   validates the raw IPC payload into the renderer's StatusView contract.
 *
 * USAGE:
 * await assayerBridgeGetStatusAdapter();
 * // Returns a validated StatusView from the desktop main process
 */
import { statusViewContract } from '../../../contracts/status-view/status-view-contract';
import type { StatusView } from '../../../contracts/status-view/status-view-contract';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const assayerBridgeGetStatusAdapter = async (): Promise<StatusView> => {
  const bridge = window.assayerBridge;

  if (bridge?.getStatus === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getStatus();

  return statusViewContract.parse(raw);
};
