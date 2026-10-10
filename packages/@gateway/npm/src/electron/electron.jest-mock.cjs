/**
 * The module Jest loads for `#gateway/npm/electron` in every test outside the npm gateway. Electron's
 * main-process and renderer APIs exist only inside the Electron runtime. Under plain Node,
 * `require('electron')` answers the binary's path string, so `app`, `ipcMain` and the rest would read
 * undefined.
 *
 * Every object here comes from `ElectronDoubleStub()` in `electron-double.stub.ts`, which
 * `electron.proxy.ts` requires by the same path. Jest keys its module registry on that resolved
 * path, so the code under test and the proxy share one set of objects. This file adds only the two
 * shapes a plain object cannot carry: `BrowserWindow` as a constructor, and `default` as a getter,
 * so a proxy can change the binary path per test.
 */
'use strict';

const electronDouble = require('./electron-double.stub').ElectronDoubleStub();

function BrowserWindow(...args) {
  electronDouble.browserWindow.created(...args);
}

BrowserWindow.prototype.loadURL = function loadURL(...args) {
  return electronDouble.browserWindow.loadURL(...args);
};

BrowserWindow.prototype.on = function on(...args) {
  return electronDouble.browserWindow.on(...args);
};

BrowserWindow.prototype.getBounds = function getBounds(...args) {
  return electronDouble.browserWindow.getBounds(...args);
};

BrowserWindow.prototype.isMaximized = function isMaximized(...args) {
  return electronDouble.browserWindow.isMaximized(...args);
};

BrowserWindow.prototype.isFullScreen = function isFullScreen(...args) {
  return electronDouble.browserWindow.isFullScreen(...args);
};

BrowserWindow.prototype.maximize = function maximize(...args) {
  return electronDouble.browserWindow.maximize(...args);
};

BrowserWindow.prototype.setFullScreen = function setFullScreen(...args) {
  return electronDouble.browserWindow.setFullScreen(...args);
};

module.exports = {
  __esModule: true,
  app: electronDouble.app,
  BrowserWindow,
  contextBridge: electronDouble.contextBridge,
  ipcMain: electronDouble.ipcMain,
  ipcRenderer: electronDouble.ipcRenderer,
  Menu: electronDouble.Menu,
  screen: electronDouble.screen,
};

Object.defineProperty(module.exports, 'default', {
  enumerable: true,
  get: () => electronDouble.executablePath.read(),
});
