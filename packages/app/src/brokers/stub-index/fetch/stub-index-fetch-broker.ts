/**
 * PURPOSE: Fetches the merged stub view via the preload bridge adapter. Atomic broker — the single
 *   seam the stub-index binding subscribes to.
 *
 * USAGE:
 * await stubIndexFetchBroker();
 * // Returns the StubView from the desktop main process
 */
import type { StubView } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { stubViewContract } from '@assayer/shared/contracts';

export const stubIndexFetchBroker = async (): Promise<StubView> => {
  const bridge = window.assayerBridge;

  if (bridge?.getStubs === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getStubs();

  return stubViewContract.parse(raw);
};
