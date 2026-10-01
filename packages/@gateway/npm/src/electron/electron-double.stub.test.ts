import { ElectronDoubleStub } from './electron-double.stub';

describe('ElectronDoubleStub', () => {
  it('VALID: {called twice} => answers the same instance both times', () => {
    expect(ElectronDoubleStub()).toBe(ElectronDoubleStub());
  });

  describe('executablePath.read()', () => {
    it('VALID: {} => answers the stand-in binary path', () => {
      expect(ElectronDoubleStub().executablePath.read()).toBe('/electron-jest-double/electron');
    });
  });

  describe('ipcMain.handle()', () => {
    it('VALID: {two channels} => registers each handler under its channel, in order', () => {
      const statusHandler = (): string => 'status';
      const runHandler = (): string => 'run';

      ElectronDoubleStub().ipcMain.handle('assayer:status', statusHandler);
      ElectronDoubleStub().ipcMain.handle('assayer:run', runHandler);

      expect([...ElectronDoubleStub().registry.invokeHandlers().entries()]).toStrictEqual([
        ['assayer:status', statusHandler],
        ['assayer:run', runHandler],
      ]);
    });

    it('ERROR: {one channel twice} => throws the error Electron throws', () => {
      ElectronDoubleStub().ipcMain.handle('assayer:status', () => 'first');

      expect(() => {
        ElectronDoubleStub().ipcMain.handle('assayer:status', () => 'second');
      }).toThrow(/^Attempted to register a second handler for 'assayer:status'$/u);
    });

    it('EMPTY: {a test that registered nothing} => no handler is left from an earlier test', () => {
      expect([...ElectronDoubleStub().registry.invokeHandlers().keys()]).toStrictEqual([]);
    });
  });

  describe('app', () => {
    it('VALID: {on} => registers the listener under its event and answers the app', () => {
      const listener = (): void => undefined;

      const result = ElectronDoubleStub().app.on('window-all-closed', listener);

      expect({
        result,
        listeners: ElectronDoubleStub().registry.appListeners({ event: 'window-all-closed' }),
      }).toStrictEqual({ result: ElectronDoubleStub().app, listeners: [listener] });
    });

    it('VALID: {whenReady} => resolves', async () => {
      await expect(ElectronDoubleStub().app.whenReady()).resolves.toBe(undefined);
    });
  });

  describe('browserWindow.loadURL()', () => {
    it('ERROR: {nothing staged} => rejects naming electronProxy', async () => {
      await expect(
        ElectronDoubleStub().browserWindow.loadURL('http://localhost:6273'),
      ).rejects.toThrow(
        /^electron double: BrowserWindow\.loadURL\('http:\/\/localhost:6273'\) has no staged answer\. Compose electronProxy from '#gateway\/npm\/electron\/electron\.proxy' and stage it with loadUrlResolves\.$/u,
      );
    });
  });

  describe('ipcRenderer', () => {
    it('ERROR: {invoke with nothing staged} => rejects naming electronProxy', async () => {
      await expect(ElectronDoubleStub().ipcRenderer.invoke('assayer:status')).rejects.toThrow(
        /^electron double: ipcRenderer\.invoke\('assayer:status'\) has no staged answer\. Compose electronProxy from '#gateway\/npm\/electron\/electron\.proxy' and stage it with invokeResolves\.$/u,
      );
    });

    it('VALID: {on twice on one channel} => keeps both listeners in order and answers ipcRenderer', () => {
      const first = (): void => undefined;
      const second = (): void => undefined;

      ElectronDoubleStub().ipcRenderer.on('assayer:run-output', first);
      const result = ElectronDoubleStub().ipcRenderer.on('assayer:run-output', second);

      expect({
        result,
        listeners: ElectronDoubleStub().registry.rendererListeners({ channel: 'assayer:run-output' }),
      }).toStrictEqual({ result: ElectronDoubleStub().ipcRenderer, listeners: [first, second] });
    });

    it('VALID: {removeAllListeners} => drops every listener on that channel only', () => {
      const output = (): void => undefined;
      const other = (): void => undefined;
      ElectronDoubleStub().ipcRenderer.on('assayer:run-output', output);
      ElectronDoubleStub().ipcRenderer.on('assayer:other', other);

      ElectronDoubleStub().ipcRenderer.removeAllListeners('assayer:run-output');

      expect({
        output: ElectronDoubleStub().registry.rendererListeners({ channel: 'assayer:run-output' }),
        other: ElectronDoubleStub().registry.rendererListeners({ channel: 'assayer:other' }),
      }).toStrictEqual({ output: [], other: [other] });
    });

    it('VALID: {on after removeAllListeners} => keeps only the listener added after the removal', () => {
      const before = (): void => undefined;
      const after = (): void => undefined;
      ElectronDoubleStub().ipcRenderer.on('assayer:run-output', before);
      ElectronDoubleStub().ipcRenderer.removeAllListeners('assayer:run-output');

      ElectronDoubleStub().ipcRenderer.on('assayer:run-output', after);

      expect(
        ElectronDoubleStub().registry.rendererListeners({ channel: 'assayer:run-output' }),
      ).toStrictEqual([after]);
    });
  });

  describe('contextBridge.exposeInMainWorld()', () => {
    it('VALID: {key, api} => puts the API in the main world under the key', () => {
      const api = { getStatus: (): string => 'status' };

      ElectronDoubleStub().contextBridge.exposeInMainWorld('assayerBridge', api);

      expect(ElectronDoubleStub().registry.mainWorld().get('assayerBridge')).toBe(api);
    });

    it('ERROR: {one key twice} => throws the error Electron throws', () => {
      ElectronDoubleStub().contextBridge.exposeInMainWorld('assayerBridge', {});

      expect(() => {
        ElectronDoubleStub().contextBridge.exposeInMainWorld('assayerBridge', {});
      }).toThrow(/^Cannot bind an API on top of an existing property on the window object$/u);
    });
  });
});
