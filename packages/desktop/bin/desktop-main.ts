/**
 * PURPOSE: Electron main process entry — creates the window, loads the renderer, and registers
 *   the `assayer:status` IPC handler. Framework bootstrap (in bin/, eslint-ignored like the CLI).
 *
 * USAGE:
 * electron dist/bin/desktop-main.js --repo /path/to/repo
 */
import { join } from 'node:path';

import { app, BrowserWindow, ipcMain } from 'electron';

import { repoPathContract } from '../src/contracts/repo-path/repo-path-contract';
import { StatusIpcResponder } from '../src/responders/status/ipc/status-ipc-responder';

const REPO_FLAG = '--repo';
const DEV_URL = 'http://localhost:5173';

const resolveRepoPath = () => {
  const flagIndex = process.argv.indexOf(REPO_FLAG);
  const provided = flagIndex >= 0 ? process.argv[flagIndex + 1] : undefined;
  return provided ?? '.';
};

const createWindow = (): void => {
  const repoPath = repoPathContract.parse(resolveRepoPath());

  const window = new BrowserWindow({
    width: 1100,
    height: 760,
    title: 'Assayer',
    webPreferences: {
      preload: join(__dirname, 'desktop-preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  ipcMain.handle('assayer:status', () => StatusIpcResponder({ repoPath }));

  const loaded =
    process.env.ASSAYER_DEV === '1'
      ? window.loadURL(DEV_URL)
      : window.loadFile(join(__dirname, '..', '..', '..', 'app', 'dist', 'index.html'));

  loaded.catch((error: unknown) => {
    process.stderr.write(`[assayer-desktop] renderer load failed: ${String(error)}\n`);
  });
};

app
  .whenReady()
  .then(createWindow)
  .catch((error: unknown) => {
    process.stderr.write(`[assayer-desktop] app ready failed: ${String(error)}\n`);
  });

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
