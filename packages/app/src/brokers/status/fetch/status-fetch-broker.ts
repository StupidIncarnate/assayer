/**
 * PURPOSE: Fetches the assayer status view via the preload bridge adapter. Atomic broker — the
 *   single seam the status binding subscribes to.
 *
 * USAGE:
 * await statusFetchBroker();
 * // Returns the StatusView from the desktop main process
 */
import type { StatusView } from '../../../contracts/status-view/status-view-contract';
import { window } from '#gateway/browser/window';
import { statusViewContract } from '../../../contracts/status-view/status-view-contract';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const statusFetchBroker = async (): Promise<StatusView> => {
  const bridge = window.assayerBridge;

  if (bridge?.getStatus === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getStatus();

  return statusViewContract.parse(raw);
};
