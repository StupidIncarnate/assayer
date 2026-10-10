/**
 * PURPOSE: Wraps the Electron main-process boot sequence — registers the status, compiled-tree,
 *   compiled-file, stubs, run and saved-run IPC handlers, waits for app-ready, opens the BrowserWindow
 *   (with the preload + renderer URL it resolves), and wires quit-on-all-closed. The single Electron
 *   main-process I/O boundary.
 *
 * USAGE:
 * await desktopBootBroker({
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
 *   stubsChannel: 'assayer:stubs',
 *   runChannel: 'assayer:run',
 *   savedRunChannel: 'assayer:saved-run',
 *   savedConsoleChannel: 'assayer:saved-console',
 *   resolveStatus,
 *   resolveCompiledTree,
 *   resolveCompiledFile,
 *   resolveStubs,
 *   resolveRun,
 *   resolveSavedRun,
 *   resolveSavedConsole,
 * });
 * // Resolves once the window has loaded
 */
import { app, BrowserWindow, Menu, ipcMain, screen } from '#gateway/npm/electron';
import type { IpcMainInvokeEvent, Rectangle } from '#gateway/npm/electron';
import { resolveModulePath } from '#gateway/node/module';
import { join } from '#gateway/node/path';
import { getEnv, getPlatform, stderr } from '#gateway/node/process';
import { pathToFileURL } from '#gateway/node/url';
import type { CompiledTree, CompiledFileView, RunResult, StubView } from '@assayer/shared/contracts';

import { ipcReplyTransformer } from '../../../transformers/ipc-reply/ipc-reply-transformer';
import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';
import { windowStateContract } from '../../../contracts/window-state/window-state-contract';
import { isWindowWithinDisplaysGuard } from '../../../guards/is-window-within-displays/is-window-within-displays-guard';
import { windowNormalBoundsTransformer } from '../../../transformers/window-normal-bounds/window-normal-bounds-transformer';
import { windowStateLoadBroker } from '../../window-state/load/window-state-load-broker';
import { windowStateSaveBroker } from '../../window-state/save/window-state-save-broker';

export const desktopBootBroker = async ({
  repoPath,
  statusChannel,
  compiledTreeChannel,
  compiledFileChannel,
  stubsChannel,
  runChannel,
  savedRunChannel,
  savedConsoleChannel,
  runOutputChannel,
  resolveStatus,
  resolveCompiledTree,
  resolveCompiledFile,
  resolveStubs,
  resolveRun,
  resolveSavedRun,
  resolveSavedConsole,
}: {
  repoPath: string;
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
  stubsChannel: string;
  runChannel: string;
  savedRunChannel: string;
  savedConsoleChannel: string;
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
  resolveSavedConsole: (params: { relPath: unknown }) => Promise<string | undefined>;
}): Promise<void> => {
  const preloadPath = join(__dirname, '../../../../bin/desktop-preload.js');
  // The built page belongs to `@assayer/app`, a declared dependency, and is found through its
  // `./page` export from this file. That resolves in this monorepo and in any installed layout alike.
  const rendererUrl =
    getEnv('ASSAYER_DEV') === '1'
      ? 'http://localhost:6273'
      : pathToFileURL(resolveModulePath({ specifier: '@assayer/app/page', fromPath: __filename })).href;

  // Every handler ANSWERS with an IpcReply and none of them throws. Electron builds
  // `Error invoking remote method '<channel>': <error>` in the renderer out of a flag it sets only
  // when a handler throws, and no option turns that text off — so a resolver's P1 error reaches the
  // UI intact only by travelling as data. Routing every one through ipcReplyTransformer is what makes
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
  // The SAVED half of the run console, and like savedRun it never executes anything: it answers what
  // a past run wrote, so a reader can see why a file failed without running it again.
  ipcMain.handle(savedConsoleChannel, async (_event: unknown, relPath: unknown) =>
    ipcReplyTransformer({ resolve: async () => resolveSavedConsole({ relPath }) }),
  );
  await app.whenReady();

  // Remove the application menu entirely so the Assayer window is a chromeless surface — no
  // File/Edit/View/Window/Help bar. Set before the window is created so it opens menu-less.
  Menu.setApplicationMenu(null);

  const savedState = await windowStateLoadBroker({ repoPath });
  const displays = screen.getAllDisplays();
  const hasValidPosition = isWindowWithinDisplaysGuard({
    x: savedState.x,
    y: savedState.y,
    displays,
  });

  const window = new BrowserWindow({
    // Wide enough for every column the explorer can show at once: tree + code + detail + the run
    // console. At 1100 the four do fit — but only by starving the code pane to ~60px, and the detail
    // panel clipped its own tab strip even before the console existed.
    width: savedState.width,
    height: savedState.height,
    ...(hasValidPosition && savedState.x !== undefined && savedState.y !== undefined
      ? { x: savedState.x, y: savedState.y }
      : {}),
    title: 'Assayer',
    // Headless for e2e: there is no Xvfb here, so tests set ASSAYER_HEADLESS=1 to create the
    // window hidden (Playwright still drives a hidden BrowserWindow) — it never pops up on the
    // developer's display. Production launches leave the flag unset, so the window shows normally.
    show: getEnv('ASSAYER_HEADLESS') !== '1',
    // sandbox:false so the tsc-emitted multi-file preload can `require` its own modules;
    // contextIsolation + nodeIntegration:false keep the renderer boundary secure.
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // A headless window renders offscreen. A plain hidden window repaints about once a second, even
      // with backgroundThrottling off, and Playwright waits for two repaints before every click or
      // hover, so each action costs about 2s. An offscreen window repaints at 60fps and never appears on
      // the display.
      offscreen: getEnv('ASSAYER_HEADLESS') === '1',
    },
  });

  if (savedState.isMaximized) {
    window.maximize();
  }
  if (savedState.isFullScreen) {
    window.setFullScreen(true);
  }

  let normalBounds: Rectangle = windowNormalBoundsTransformer({
    bounds: {
      width: savedState.width,
      height: savedState.height,
      x: hasValidPosition && savedState.x !== undefined ? savedState.x : 0,
      y: hasValidPosition && savedState.y !== undefined ? savedState.y : 0,
    },
  });

  window.on('resize', () => {
    if (!window.isMaximized() && !window.isFullScreen()) {
      normalBounds = windowNormalBoundsTransformer({ bounds: window.getBounds() });
    }
  });

  window.on('move', () => {
    if (!window.isMaximized() && !window.isFullScreen()) {
      normalBounds = windowNormalBoundsTransformer({ bounds: window.getBounds() });
    }
  });

  window.on('close', () => {
    const isMaximized = window.isMaximized();
    const isFullScreen = window.isFullScreen();

    windowStateSaveBroker({
      repoPath,
      state: windowStateContract.parse({
        ...normalBounds,
        isMaximized,
        isFullScreen,
      }),
    }).catch((error: unknown) => {
      stderr.write(`assayer: failed to persist window state: ${String(error)}\n`);
    });
  });

  await window.loadURL(rendererUrl);

  app.on('window-all-closed', () => {
    if (getPlatform() !== 'darwin') {
      app.quit();
    }
  });
};
