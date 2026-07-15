/**
 * PURPOSE: Wraps the Electron preload contextBridge — exposes a typed `assayerBridge` on window
 *   whose methods invoke their respective IPC channels. The single preload-context I/O boundary.
 *
 *   `runFile` and `getSavedRun` stay separate all the way across the bridge for the same reason they
 *   are separate channels: reading what a file's last run said must never be able to start one.
 *
 * USAGE:
 * electronPreloadBridgeAdapter({
 *   bridgeKey: 'assayerBridge',
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
 *   runChannel: 'assayer:run',
 *   savedRunChannel: 'assayer:saved-run',
 * });
 * // Returns { success: true } after exposing the bridge
 */
import { contextBridge, ipcRenderer } from 'electron';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const electronPreloadBridgeAdapter = ({
  bridgeKey,
  statusChannel,
  compiledTreeChannel,
  compiledFileChannel,
  runChannel,
  savedRunChannel,
}: {
  bridgeKey: string;
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
  runChannel: string;
  savedRunChannel: string;
}): AdapterResult => {
  contextBridge.exposeInMainWorld(bridgeKey, {
    getStatus: async (): Promise<unknown> => ipcRenderer.invoke(statusChannel),
    getCompiledTree: async (): Promise<unknown> => ipcRenderer.invoke(compiledTreeChannel),
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      ipcRenderer.invoke(compiledFileChannel, relPath),
    runFile: async ({ relPath }: { relPath: string }): Promise<unknown> => ipcRenderer.invoke(runChannel, relPath),
    getSavedRun: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      ipcRenderer.invoke(savedRunChannel, relPath),
  });

  return { success: true as const };
};
