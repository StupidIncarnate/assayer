/**
 * PURPOSE: Wraps the Electron main-process boot sequence — registers the status, compiled-tree,
 *   and compiled-file IPC handlers, waits for app-ready, opens the BrowserWindow (with the preload
 *   + renderer URL it resolves), and wires quit-on-all-closed. The single Electron main-process
 *   I/O boundary.
 *
 * USAGE:
 * await electronDesktopBootAdapter({
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
 *   resolveStatus,
 *   resolveCompiledTree,
 *   resolveCompiledFile,
 * });
 * // Returns { success: true } once the window has loaded
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { CompiledTree, CompiledFileView } from '@assayer/shared/contracts';

import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';

export const electronDesktopBootAdapter = async ({
  statusChannel,
  compiledTreeChannel,
  compiledFileChannel,
  resolveStatus,
  resolveCompiledTree,
  resolveCompiledFile,
}: {
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
  resolveStatus: () => DesktopStatus;
  resolveCompiledTree: () => Promise<CompiledTree>;
  resolveCompiledFile: (params: { relPath: unknown }) => Promise<CompiledFileView>;
}): Promise<AdapterResult> => {
  const preloadPath = join(__dirname, '../../../../bin/desktop-preload.js');
  const rendererUrl =
    process.env.ASSAYER_DEV === '1'
      ? 'http://localhost:6273'
      : pathToFileURL(join(__dirname, '../../../../../../app/dist/index.html')).href;

  ipcMain.handle(statusChannel, () => resolveStatus());
  ipcMain.handle(compiledTreeChannel, async () => resolveCompiledTree());
  ipcMain.handle(compiledFileChannel, async (_event: unknown, relPath: unknown) => resolveCompiledFile({ relPath }));
  await app.whenReady();

  // Remove the application menu entirely so the Assayer window is a chromeless surface — no
  // File/Edit/View/Window/Help bar. Set before the window is created so it opens menu-less.
  Menu.setApplicationMenu(null);

  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    title: 'Assayer',
    // Headless for e2e: there is no Xvfb here, so tests set ASSAYER_HEADLESS=1 to create the
    // window hidden (Playwright still drives a hidden BrowserWindow) — it never pops up on the
    // developer's display. Production launches leave the flag unset, so the window shows normally.
    show: process.env.ASSAYER_HEADLESS !== '1',
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
