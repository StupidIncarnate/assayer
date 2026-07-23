/**
 * PURPOSE: Reads the merged stub view over the preload contextBridge (window.assayerBridge) and
 *   validates the raw IPC payload into the shared StubView contract. The stub-repository's read seam —
 *   the derived stub index combined with the committed overlay, resolved once per open by the desktop
 *   main process.
 *
 * USAGE:
 * await assayerBridgeGetStubsAdapter();
 * // Returns a validated StubView from the desktop main process
 */
import { stubViewContract } from '@assayer/shared/contracts';
import type { StubView } from '@assayer/shared/contracts';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const assayerBridgeGetStubsAdapter = async (): Promise<StubView> => {
  const bridge = window.assayerBridge;

  if (bridge?.getStubs === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getStubs();

  return stubViewContract.parse(raw);
};
