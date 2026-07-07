/**
 * PURPOSE: Wraps the Electron preload contextBridge — exposes a typed `assayerBridge` on window
 *   whose getStatus() invokes the status IPC channel. The single preload-context I/O boundary.
 *
 * USAGE:
 * electronPreloadBridgeAdapter({ bridgeKey: 'assayerBridge', statusChannel: 'assayer:status' });
 * // Returns { success: true } after exposing the bridge
 */
import { contextBridge, ipcRenderer } from 'electron';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const electronPreloadBridgeAdapter = ({
  bridgeKey,
  statusChannel,
}: {
  bridgeKey: string;
  statusChannel: string;
}): AdapterResult => {
  contextBridge.exposeInMainWorld(bridgeKey, {
    getStatus: async (): Promise<unknown> => ipcRenderer.invoke(statusChannel),
  });

  return { success: true as const };
};
