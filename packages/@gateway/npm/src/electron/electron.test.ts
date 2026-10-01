import electronBinaryPath, {
  app,
  BrowserWindow,
  contextBridge,
  ipcMain,
  ipcRenderer,
  Menu,
} from './electron';
import { ElectronDoubleStub } from './electron-double.stub';
import { electronProxy } from './electron.proxy';
// A raw `require`, not `import * as`: `import x = require(...)` compiles straight to `require(...)`,
// so pkgModule is what Node itself hands a plain process, the binary path string.
import pkgModule = require('electron');

// This package's own run loads the real `electron`, so the barrel tests below see plain Node. Every
// other package's run gets `electron.jest-mock.cjs` for `#gateway/npm/electron`, which serves
// `ElectronDoubleStub()`; the electronProxy tests drive that double the way desktop's code does.
describe('#gateway/npm/electron', () => {
  describe('barrel, outside Electron', () => {
    it('VALID: {default export} => is the same binary path string the electron package answers', () => {
      const binaryPath: unknown = electronBinaryPath;

      expect(binaryPath).toBe(pkgModule);
    });

    it('EDGE: {main-process and renderer names} => every one reads undefined', () => {
      expect({ app, BrowserWindow, contextBridge, ipcMain, ipcRenderer, Menu }).toStrictEqual({
        app: undefined,
        BrowserWindow: undefined,
        contextBridge: undefined,
        ipcMain: undefined,
        ipcRenderer: undefined,
        Menu: undefined,
      });
    });
  });

  describe('electronProxy, default export', () => {
    it('VALID: {nothing staged} => reads the stand-in binary path', () => {
      electronProxy();

      expect(ElectronDoubleStub().executablePath.read()).toBe('/electron-jest-double/electron');
    });

    it('VALID: {executablePathIs} => reads the staged path', () => {
      const proxy = electronProxy();
      proxy.executablePathIs({ path: '/usr/bin/electron' });

      expect(ElectronDoubleStub().executablePath.read()).toBe('/usr/bin/electron');
    });

    it('EDGE: {runningInsideElectron} => reads the API object instead of a path string', () => {
      const proxy = electronProxy();
      proxy.runningInsideElectron();

      expect(ElectronDoubleStub().executablePath.read()).toBe(ElectronDoubleStub());
    });
  });

  describe('electronProxy, ipcMain', () => {
    it('VALID: {handle on two channels} => records each call and lists the channels in registration order', () => {
      const proxy = electronProxy();
      const statusHandler = (): string => 'status';
      const runHandler = (): string => 'run';

      ElectronDoubleStub().ipcMain.handle('assayer:status', statusHandler);
      ElectronDoubleStub().ipcMain.handle('assayer:run', runHandler);

      expect({
        channels: proxy.getHandledChannels(),
        statusCalls: proxy.getHandleCallsFor({ channel: 'assayer:status' }),
      }).toStrictEqual({
        channels: ['assayer:status', 'assayer:run'],
        statusCalls: [['assayer:status', statusHandler]],
      });
    });

    it('VALID: {invokeHandler} => hands the handler the args and answers what it answers', async () => {
      const proxy = electronProxy();
      ElectronDoubleStub().ipcMain.handle(
        'assayer:compiled-file',
        (_event: unknown, relPath: unknown): unknown => ({ relPath }),
      );

      const result = await proxy.invokeHandler({
        channel: 'assayer:compiled-file',
        args: ['src/foo.ts'],
      });

      expect(result).toStrictEqual({ relPath: 'src/foo.ts' });
    });

    it('VALID: {handler sends to its sender} => getSentToSenderFor reads back every send on that channel', async () => {
      const proxy = electronProxy();
      ElectronDoubleStub().ipcMain.handle('assayer:run', (): string => {
        ElectronDoubleStub().webContents.send('assayer:run-output', 'chunk one');
        ElectronDoubleStub().webContents.send('assayer:run-output', 'chunk two');

        return 'done';
      });

      const result = await proxy.invokeHandler({ channel: 'assayer:run', args: [] });

      expect({
        result,
        sent: proxy.getSentToSenderFor({ channel: 'assayer:run-output' }),
      }).toStrictEqual({
        result: 'done',
        sent: [
          ['assayer:run-output', 'chunk one'],
          ['assayer:run-output', 'chunk two'],
        ],
      });
    });

    it('VALID: {invokeHandler} => hands the handler an event whose sender is the recording webContents', async () => {
      const proxy = electronProxy();
      ElectronDoubleStub().ipcMain.handle('assayer:status', (event: unknown): unknown => event);

      const event = await proxy.invokeHandler({ channel: 'assayer:status', args: [] });

      expect(event).toStrictEqual({ sender: ElectronDoubleStub().webContents });
    });

    it('ERROR: {invokeHandler on a channel with no handler} => rejects with the error Electron builds', async () => {
      const proxy = electronProxy();

      await expect(proxy.invokeHandler({ channel: 'assayer:stubs', args: [] })).rejects.toThrow(
        /^Error invoking remote method 'assayer:stubs': No handler registered for 'assayer:stubs'$/u,
      );
    });

    it('EMPTY: {no handler registered} => getHandledChannels answers no channels', () => {
      const proxy = electronProxy();

      expect(proxy.getHandledChannels()).toStrictEqual([]);
    });
  });

  describe('electronProxy, app and Menu', () => {
    it('VALID: {app.on, then emitAppEvent} => runs the listener with the args and records the registration', () => {
      const proxy = electronProxy();
      const received: unknown[][] = [];
      const listener = (...args: readonly unknown[]): void => {
        received.push([...args]);
      };
      ElectronDoubleStub().app.on('window-all-closed', listener);

      proxy.emitAppEvent({ event: 'window-all-closed', args: [] });

      expect({
        received,
        onCalls: proxy.getAppOnCallsFor({ event: 'window-all-closed' }),
      }).toStrictEqual({
        received: [[]],
        onCalls: [['window-all-closed', listener]],
      });
    });

    it('VALID: {app.quit} => getQuitCalls reads back the call', () => {
      const proxy = electronProxy();

      ElectronDoubleStub().app.quit();

      expect(proxy.getQuitCalls()).toStrictEqual([[]]);
    });

    it('VALID: {Menu.setApplicationMenu(null)} => getApplicationMenuCallsFor reads back the call', () => {
      const proxy = electronProxy();

      ElectronDoubleStub().Menu.setApplicationMenu(null);

      expect(proxy.getApplicationMenuCallsFor({ menu: null })).toStrictEqual([[null]]);
    });
  });

  describe('electronProxy, BrowserWindow', () => {
    it('VALID: {a window is created} => getBrowserWindowCallsFor matches it by the option keys given', () => {
      const proxy = electronProxy();
      const options = { title: 'Assayer', webPreferences: { sandbox: false } };

      ElectronDoubleStub().browserWindow.created(options);

      expect(proxy.getBrowserWindowCallsFor({ options: { title: 'Assayer' } })).toStrictEqual([
        [options],
      ]);
    });

    it('VALID: {loadUrlResolves} => loadURL resolves for that URL and is read back', async () => {
      const proxy = electronProxy();
      proxy.loadUrlResolves({ url: 'http://localhost:6273' });

      await expect(
        ElectronDoubleStub().browserWindow.loadURL('http://localhost:6273'),
      ).resolves.toBe(undefined);
      expect(proxy.getLoadUrlCallsFor({ url: 'http://localhost:6273' })).toStrictEqual([
        ['http://localhost:6273'],
      ]);
    });

    it('ERROR: {loadUrlConnectionRefused} => loadURL rejects with the error Electron builds', async () => {
      const proxy = electronProxy();
      proxy.loadUrlConnectionRefused({ url: 'http://localhost:6273' });

      await expect(ElectronDoubleStub().browserWindow.loadURL('http://localhost:6273')).rejects.toThrow(
        /^ERR_CONNECTION_REFUSED \(-102\) loading 'http:\/\/localhost:6273'$/u,
      );
    });

    it('ERROR: {loadUrlFileNotFound} => loadURL rejects with the error Electron builds', async () => {
      const proxy = electronProxy();
      proxy.loadUrlFileNotFound({ url: 'file:///repo/packages/app/dist/index.html' });

      await expect(
        ElectronDoubleStub().browserWindow.loadURL('file:///repo/packages/app/dist/index.html'),
      ).rejects.toThrow(
        /^ERR_FILE_NOT_FOUND \(-6\) loading 'file:\/\/\/repo\/packages\/app\/dist\/index\.html'$/u,
      );
    });

    it('ERROR: {loadURL on a URL nothing staged} => throws naming the staged URLs', async () => {
      const proxy = electronProxy();
      proxy.loadUrlResolves({ url: 'http://localhost:6273' });

      await expect(async () =>
        ElectronDoubleStub().browserWindow.loadURL('file:///other.html'),
      ).rejects.toThrow(
        /^registerMock: nothing set up for the call loadURL\("file:\/\/\/other\.html"\)\. Calls that ARE set up: \("http:\/\/localhost:6273"\)$/u,
      );
    });
  });

  describe('electronProxy, ipcRenderer', () => {
    it('VALID: {invokeResolves per channel} => each invoke answers its own channel and is read back', async () => {
      const proxy = electronProxy();
      proxy.invokeResolves({ channel: 'assayer:status', args: [], value: { success: true } });
      proxy.invokeResolves({
        channel: 'assayer:compiled-file',
        args: ['src/foo.ts'],
        value: { success: true, valueRaw: 'file' },
      });

      const status = await ElectronDoubleStub().ipcRenderer.invoke('assayer:status');
      const file = await ElectronDoubleStub().ipcRenderer.invoke('assayer:compiled-file', 'src/foo.ts');

      expect({
        status,
        file,
        fileCalls: proxy.getInvokeCallsFor({ channel: 'assayer:compiled-file' }),
      }).toStrictEqual({
        status: { success: true },
        file: { success: true, valueRaw: 'file' },
        fileCalls: [['assayer:compiled-file', 'src/foo.ts']],
      });
    });

    it('ERROR: {invokeNoHandler} => invoke rejects with the error Electron builds', async () => {
      const proxy = electronProxy();
      proxy.invokeNoHandler({ channel: 'assayer:status', args: [] });

      await expect(ElectronDoubleStub().ipcRenderer.invoke('assayer:status')).rejects.toThrow(
        /^Error invoking remote method 'assayer:status': No handler registered for 'assayer:status'$/u,
      );
    });

    it('ERROR: {invokeHandlerThrew} => invoke rejects with the error Electron builds', async () => {
      const proxy = electronProxy();
      proxy.invokeHandlerThrew({ channel: 'assayer:run', args: ['src/a.ts'], message: 'boom' });

      await expect(ElectronDoubleStub().ipcRenderer.invoke('assayer:run', 'src/a.ts')).rejects.toThrow(
        /^Error invoking remote method 'assayer:run': Error: boom$/u,
      );
    });

    it('ERROR: {invoke on a channel nothing staged} => throws naming the staged calls', async () => {
      const proxy = electronProxy();
      proxy.invokeResolves({ channel: 'assayer:status', args: [], value: { success: true } });

      await expect(async () => ElectronDoubleStub().ipcRenderer.invoke('assayer:stubs')).rejects.toThrow(
        /^registerMock: nothing set up for the call invoke\("assayer:stubs"\)\. Calls that ARE set up: \("assayer:status"\)$/u,
      );
    });

    it('VALID: {on, then emitToRenderer} => the listener receives the event and the args', () => {
      const proxy = electronProxy();
      const received: unknown[][] = [];
      const listener = (event: unknown, ...args: readonly unknown[]): void => {
        received.push([event, ...args]);
      };
      ElectronDoubleStub().ipcRenderer.on('assayer:run-output', listener);

      proxy.emitToRenderer({ channel: 'assayer:run-output', args: ['chunk'] });

      expect({
        received,
        onCalls: proxy.getOnCallsFor({ channel: 'assayer:run-output' }),
      }).toStrictEqual({
        received: [[{ sender: ElectronDoubleStub().ipcRenderer }, 'chunk']],
        onCalls: [['assayer:run-output', listener]],
      });
    });

    it('VALID: {removeAllListeners, then emitToRenderer} => no listener receives anything', () => {
      const proxy = electronProxy();
      const received: unknown[] = [];
      ElectronDoubleStub().ipcRenderer.on('assayer:run-output', (_event: unknown, chunk: unknown) => {
        received.push(chunk);
      });

      ElectronDoubleStub().ipcRenderer.removeAllListeners('assayer:run-output');
      proxy.emitToRenderer({ channel: 'assayer:run-output', args: ['chunk'] });

      expect({
        received,
        removeCalls: proxy.getRemoveAllListenersCallsFor({ channel: 'assayer:run-output' }),
      }).toStrictEqual({
        received: [],
        removeCalls: [['assayer:run-output']],
      });
    });
  });

  describe('electronProxy, contextBridge', () => {
    it('VALID: {exposeInMainWorld} => getExposedApi answers the API under its key', () => {
      const proxy = electronProxy();
      const api = { getStatus: (): string => 'status' };

      ElectronDoubleStub().contextBridge.exposeInMainWorld('assayerBridge', api);

      expect({
        exposed: proxy.getExposedApi({ key: 'assayerBridge' }),
        calls: proxy.getExposeCallsFor({ key: 'assayerBridge' }),
      }).toStrictEqual({
        exposed: api,
        calls: [['assayerBridge', api]],
      });
    });

    it('EMPTY: {nothing exposed} => getExposedApi answers undefined', () => {
      const proxy = electronProxy();

      expect(proxy.getExposedApi({ key: 'assayerBridge' })).toBe(undefined);
    });
  });
});
