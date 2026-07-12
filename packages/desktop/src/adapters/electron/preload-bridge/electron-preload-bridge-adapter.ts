/**
 * PURPOSE: Wraps the Electron preload contextBridge — exposes a typed `assayerBridge` on window
 *   whose getStatus()/getCompiledTree()/getCompiledFile() invoke their respective IPC channels.
 *   The single preload-context I/O boundary.
 *
 * USAGE:
 * electronPreloadBridgeAdapter({
 *   bridgeKey: 'assayerBridge',
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
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
}: {
  bridgeKey: string;
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
}): AdapterResult => {
  contextBridge.exposeInMainWorld(bridgeKey, {
    getStatus: async (): Promise<unknown> => ipcRenderer.invoke(statusChannel),
    getCompiledTree: async (): Promise<unknown> => ipcRenderer.invoke(compiledTreeChannel),
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      ipcRenderer.invoke(compiledFileChannel, relPath),
  });

  return { success: true as const };
};
