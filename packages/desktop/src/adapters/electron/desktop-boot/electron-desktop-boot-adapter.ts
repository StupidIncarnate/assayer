/**
 * PURPOSE: Wraps the Electron main-process boot sequence — registers the status IPC handler,
 *   waits for app-ready, opens the BrowserWindow (with the preload + renderer URL it resolves),
 *   and wires quit-on-all-closed. The single Electron main-process I/O boundary.
 *
 * USAGE:
 * await electronDesktopBootAdapter({ statusChannel: 'assayer:status', resolveStatus });
 * // Returns { success: true } once the window has loaded
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, ipcMain } from 'electron';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';

export const electronDesktopBootAdapter = async ({
  statusChannel,
  resolveStatus,
}: {
  statusChannel: string;
  resolveStatus: () => DesktopStatus;
}): Promise<AdapterResult> => {
  const preloadPath = join(__dirname, '../../../../bin/desktop-preload.js');
  const rendererUrl =
    process.env.ASSAYER_DEV === '1'
      ? 'http://localhost:6273'
      : pathToFileURL(join(__dirname, '../../../../../../app/dist/index.html')).href;

  ipcMain.handle(statusChannel, () => resolveStatus());
  await app.whenReady();

  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    title: 'Assayer',
    // sandbox:false so the tsc-emitted multi-file preload can `require` its own modules;
    // contextIsolation + nodeIntegration:false keep the renderer boundary secure.
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });
  await window.loadURL(rendererUrl);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  return { success: true as const };
};
