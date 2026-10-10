/**
 * PURPOSE: Gateway entry for the npm package 'electron'. It passes through only the names assayer's
 * desktop package uses, and imports nothing but `electron`, so the preload script stays small.
 * Outside the Electron runtime, `require('electron')` answers the Electron binary's path string, so
 * the default export is that path and every other name reads undefined. Jest gets
 * `electron.jest-mock.cjs` in place of this file; stage it through `electronProxy`.
 *
 * USAGE:
 * import { app, BrowserWindow, ipcMain } from '#gateway/npm/electron';
 * import electronBinaryPath from '#gateway/npm/electron';
 * // In a plain Node process, electronBinaryPath is the path to the Electron executable
 */

export { app, BrowserWindow, contextBridge, ipcMain, ipcRenderer, Menu, screen } from 'electron';
export type { IpcMainInvokeEvent } from 'electron';
export type Display = Electron.Display;
export type Rectangle = Electron.Rectangle;
export { default } from 'electron';
