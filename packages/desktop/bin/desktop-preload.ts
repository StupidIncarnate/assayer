/**
 * PURPOSE: Electron preload — exposes a typed `assayerBridge` on window via contextBridge so the
 *   renderer fetches status over IPC without Node access. Framework bootstrap (bin/, eslint-ignored).
 *
 * USAGE:
 * // Referenced by the BrowserWindow webPreferences.preload
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('assayerBridge', {
  getStatus: (): Promise<unknown> => ipcRenderer.invoke('assayer:status'),
});
