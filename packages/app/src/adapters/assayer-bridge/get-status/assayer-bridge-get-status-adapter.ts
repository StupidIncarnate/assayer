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

export const assayerBridgeGetStatusAdapter = async (): Promise<StatusView> => {
  const bridge = window.assayerBridge;

  if (bridge === undefined) {
    throw new Error(
      'Assayer preload bridge unavailable: window.assayerBridge was not exposed by the Electron ' +
        'preload. The preload never ran contextBridge.exposeInMainWorld — verify the BrowserWindow ' +
        'sets webPreferences.sandbox=false (or the preload is bundled to a single file) and that the ' +
        'preload path resolves to a built .js.',
    );
  }

  const raw: unknown = await bridge.getStatus();

  return statusViewContract.parse(raw);
};
