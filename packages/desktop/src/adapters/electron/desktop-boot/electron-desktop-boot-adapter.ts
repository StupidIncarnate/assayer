/**
 * PURPOSE: Wraps the Electron main-process boot sequence — registers the status, compiled-tree,
 *   compiled-file, stubs, run and saved-run IPC handlers, waits for app-ready, opens the BrowserWindow
 *   (with the preload + renderer URL it resolves), and wires quit-on-all-closed. The single Electron
 *   main-process I/O boundary.
 *
 * USAGE:
 * await electronDesktopBootAdapter({
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
 *   stubsChannel: 'assayer:stubs',
 *   runChannel: 'assayer:run',
 *   savedRunChannel: 'assayer:saved-run',
 *   resolveStatus,
 *   resolveCompiledTree,
 *   resolveCompiledFile,
 *   resolveStubs,
 *   resolveRun,
 *   resolveSavedRun,
 * });
 * // Returns { success: true } once the window has loaded
 */
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import type { CompiledTree, CompiledFileView, RunResult, StubView } from '@assayer/shared/contracts';

import { ipcReplyTransformer } from '../../../transformers/ipc-reply/ipc-reply-transformer';
import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';

export const electronDesktopBootAdapter = async ({
  statusChannel,
  compiledTreeChannel,
  compiledFileChannel,
  stubsChannel,
  runChannel,
  savedRunChannel,
  runOutputChannel,
  resolveStatus,
  resolveCompiledTree,
  resolveCompiledFile,
  resolveStubs,
  resolveRun,
  resolveSavedRun,
}: {
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
  stubsChannel: string;
  runChannel: string;
  savedRunChannel: string;
  runOutputChannel: string;
  resolveStatus: () => DesktopStatus | Promise<DesktopStatus>;
  resolveCompiledTree: () => Promise<CompiledTree>;
  resolveCompiledFile: (params: { relPath: unknown }) => Promise<CompiledFileView>;
  resolveStubs: () => Promise<StubView>;
  resolveRun: (params: {
    relPath: unknown;
    onOutput: (params: { chunk: string }) => void;
  }) => Promise<RunResult>;
  resolveSavedRun: (params: { relPath: unknown }) => Promise<RunResult | undefined>;
}): Promise<AdapterResult> => {
  const preloadPath = join(__dirname, '../../../../bin/desktop-preload.js');
  const rendererUrl =
    process.env.ASSAYER_DEV === '1'
      ? 'http://localhost:6273'
      : pathToFileURL(join(__dirname, '../../../../../../app/dist/index.html')).href;

  // Every handler ANSWERS with an IpcReply and none of them throws. Electron builds
  // `Error invoking remote method '<channel>': <error>` in the renderer out of a flag it sets only
  // when a handler throws, and no option turns that text off — so a resolver's P1 error reaches the
  // UI intact only by travelling as data. Routing all five through ipcReplyTransformer is what makes
  // that structural: there is no registration here that can throw into Electron.
  ipcMain.handle(statusChannel, async () =>
    ipcReplyTransformer({ resolve: async () => Promise.resolve(resolveStatus()) }),
  );
  ipcMain.handle(compiledTreeChannel, async () => ipcReplyTransformer({ resolve: async () => resolveCompiledTree() }));
  ipcMain.handle(compiledFileChannel, async (_event: unknown, relPath: unknown) =>
    ipcReplyTransformer({ resolve: async () => resolveCompiledFile({ relPath }) }),
  );
  ipcMain.handle(stubsChannel, async () => ipcReplyTransformer({ resolve: async () => resolveStubs() }));
  // The run's console output goes back to the SENDER, not to a captured window handle: the reply
  // belongs to whoever asked for the run, and a captured handle would keep writing into a window
  // that may already be gone.
  ipcMain.handle(runChannel, async (event: IpcMainInvokeEvent, relPath: unknown) =>
    ipcReplyTransformer({
      resolve: async () =>
        resolveRun({
          relPath,
          onOutput: ({ chunk }: { chunk: string }): void => {
            event.sender.send(runOutputChannel, chunk);
          },
        }),
    }),
  );
  ipcMain.handle(savedRunChannel, async (_event: unknown, relPath: unknown) =>
    ipcReplyTransformer({ resolve: async () => resolveSavedRun({ relPath }) }),
  );
  await app.whenReady();

  // Remove the application menu entirely so the Assayer window is a chromeless surface — no
  // File/Edit/View/Window/Help bar. Set before the window is created so it opens menu-less.
  Menu.setApplicationMenu(null);

  const window = new BrowserWindow({
    // Wide enough for every column the explorer can show at once: tree + code + detail + the run
    // console. At 1100 the four do fit — but only by starving the code pane to ~60px, and the detail
    // panel clipped its own tab strip even before the console existed.
    width: 1500,
    height: 800,
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
