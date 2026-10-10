import { registerSpyOn } from '@dungeonmaster/testing/register-mock';
import type { RecordedCalls } from '@dungeonmaster/testing/register-mock';
import { ElectronDoubleStub } from './electron-double.stub';
import { IpcInvokeRecordedErrorStub } from './ipc-invoke-recorded-error/ipc-invoke-recorded-error.stub';
import { LoadUrlRecordedErrorStub } from './load-url-recorded-error/load-url-recorded-error.stub';

// Every spy sits on the shared double that `electron.jest-mock.cjs` serves for
// `#gateway/npm/electron`. A registration call (`ipcMain.handle`, `ipcRenderer.on`,
// `exposeInMainWorld`, ...) is a `passthrough` spy: its answer is never read, so the double's own body
// runs and keeps Electron's state rules, and the spy records the call. A call whose answer matters
// (`ipcRenderer.invoke`, `loadURL`) is not passthrough: it throws unless a test staged its exact
// arguments.
export const electronProxy = (): {
  executablePathIs: (params: { path: string }) => void;
  runningInsideElectron: () => void;
  getHandledChannels: () => readonly string[];
  getHandleCallsFor: (params: { channel: string }) => RecordedCalls;
  invokeHandler: (params: { channel: string; args: readonly unknown[] }) => Promise<unknown>;
  getSentToSenderFor: (params: { channel: string }) => RecordedCalls;
  emitAppEvent: (params: { event: string; args: readonly unknown[] }) => void;
  getAppOnCallsFor: (params: { event: string }) => RecordedCalls;
  getQuitCalls: () => RecordedCalls;
  getApplicationMenuCallsFor: (params: { menu: unknown }) => RecordedCalls;
  getBrowserWindowCallsFor: (params: { options: unknown }) => RecordedCalls;
  loadUrlResolves: (params: { url: string }) => void;
  loadUrlConnectionRefused: (params: { url: string }) => void;
  loadUrlFileNotFound: (params: { url: string }) => void;
  getLoadUrlCallsFor: (params: { url: string }) => RecordedCalls;
  invokeResolves: (params: { channel: string; args: readonly unknown[]; value: unknown }) => void;
  invokeNoHandler: (params: { channel: string; args: readonly unknown[] }) => void;
  invokeHandlerThrew: (params: {
    channel: string;
    args: readonly unknown[];
    message: string;
  }) => void;
  getInvokeCallsFor: (params: { channel: string }) => RecordedCalls;
  emitToRenderer: (params: { channel: string; args: readonly unknown[] }) => void;
  getOnCallsFor: (params: { channel: string }) => RecordedCalls;
  getRemoveAllListenersCallsFor: (params: { channel: string }) => RecordedCalls;
  getExposedApi: (params: { key: string }) => unknown;
  getExposeCallsFor: (params: { key: string }) => RecordedCalls;
  setupDisplays: (params: { displays: readonly unknown[] }) => void;
  setupWindowBounds: (params: { bounds: { x: number; y: number; width: number; height: number } }) => void;
  setupIsMaximized: (params: { value: boolean }) => void;
  setupIsFullScreen: (params: { value: boolean }) => void;
  emitWindowEvent: (params: { event: string; args?: readonly unknown[] }) => void;
  getMaximizeCalls: () => RecordedCalls;
  getSetFullScreenCalls: () => RecordedCalls;
} => {
  const electronDouble = ElectronDoubleStub();

  const executablePathHandle = registerSpyOn({
    object: electronDouble.executablePath,
    method: 'read',
    passthrough: true,
  });
  const appOnHandle = registerSpyOn({ object: electronDouble.app, method: 'on', passthrough: true });
  const quitHandle = registerSpyOn({ object: electronDouble.app, method: 'quit', passthrough: true });
  const menuHandle = registerSpyOn({
    object: electronDouble.Menu,
    method: 'setApplicationMenu',
    passthrough: true,
  });
  const windowHandle = registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'created',
    passthrough: true,
  });
  const loadUrlHandle = registerSpyOn({ object: electronDouble.browserWindow, method: 'loadURL' });
  const handleHandle = registerSpyOn({
    object: electronDouble.ipcMain,
    method: 'handle',
    passthrough: true,
  });
  const sendHandle = registerSpyOn({
    object: electronDouble.webContents,
    method: 'send',
    passthrough: true,
  });
  const invokeHandle = registerSpyOn({ object: electronDouble.ipcRenderer, method: 'invoke' });
  const onHandle = registerSpyOn({
    object: electronDouble.ipcRenderer,
    method: 'on',
    passthrough: true,
  });
  const removeHandle = registerSpyOn({
    object: electronDouble.ipcRenderer,
    method: 'removeAllListeners',
    passthrough: true,
  });
  const exposeHandle = registerSpyOn({
    object: electronDouble.contextBridge,
    method: 'exposeInMainWorld',
    passthrough: true,
  });
  registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'on',
    passthrough: true,
  });
  const windowGetBoundsHandle = registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'getBounds',
    passthrough: true,
  });
  const windowIsMaximizedHandle = registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'isMaximized',
    passthrough: true,
  });
  const windowIsFullScreenHandle = registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'isFullScreen',
    passthrough: true,
  });
  const windowMaximizeHandle = registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'maximize',
    passthrough: true,
  });
  const windowSetFullScreenHandle = registerSpyOn({
    object: electronDouble.browserWindow,
    method: 'setFullScreen',
    passthrough: true,
  });
  const screenGetAllDisplaysHandle = registerSpyOn({
    object: electronDouble.screen,
    method: 'getAllDisplays',
    passthrough: true,
  });

  return {
    // The default export takes no arguments, so `[]` is the only address it has.
    executablePathIs: ({ path }: { path: string }): void => {
      executablePathHandle.calledWith([]).returns(path);
    },
    // Inside the Electron runtime the default export is the API object, not a path string.
    runningInsideElectron: (): void => {
      executablePathHandle.calledWith([]).returns(electronDouble);
    },

    // Every channel with a handler, in the order main registered them.
    getHandledChannels: (): readonly string[] => [
      ...electronDouble.registry.invokeHandlers().keys(),
    ],
    getHandleCallsFor: ({ channel }: { channel: string }): RecordedCalls =>
      handleHandle.callsMatching([channel]),
    // Calls the handler main registered for the channel, the way a renderer's invoke reaches it, and
    // answers what the handler answers. The event's `sender` records every `send`, which
    // `getSentToSenderFor` reads back. A channel with no handler rejects the way Electron does.
    invokeHandler: async ({
      channel,
      args,
    }: {
      channel: string;
      args: readonly unknown[];
    }): Promise<unknown> => {
      const handler = electronDouble.registry.invokeHandlers().get(channel);

      if (handler === undefined) {
        return Promise.reject(
          IpcInvokeRecordedErrorStub({ channel, reply: `No handler registered for '${channel}'` }),
        );
      }

      return handler({ sender: electronDouble.webContents }, ...args);
    },
    getSentToSenderFor: ({ channel }: { channel: string }): RecordedCalls =>
      sendHandle.callsMatching([channel]),

    emitAppEvent: ({ event, args }: { event: string; args: readonly unknown[] }): void => {
      for (const listener of electronDouble.registry.appListeners({ event })) {
        listener(...args);
      }
    },
    getAppOnCallsFor: ({ event }: { event: string }): RecordedCalls =>
      appOnHandle.callsMatching([event]),
    // `app.quit` takes no arguments, so `[]` is the only address it has.
    getQuitCalls: (): RecordedCalls => quitHandle.callsMatching([]),
    getApplicationMenuCallsFor: ({ menu }: { menu: unknown }): RecordedCalls =>
      menuHandle.callsMatching([menu]),

    // Matches every window whose constructor options hold the keys given.
    getBrowserWindowCallsFor: ({ options }: { options: unknown }): RecordedCalls =>
      windowHandle.callsMatching([options]),
    loadUrlResolves: ({ url }: { url: string }): void => {
      loadUrlHandle.calledWith([url]).resolves(undefined);
    },
    loadUrlConnectionRefused: ({ url }: { url: string }): void => {
      loadUrlHandle
        .calledWith([url])
        .rejects(LoadUrlRecordedErrorStub({ code: 'ERR_CONNECTION_REFUSED', url }));
    },
    loadUrlFileNotFound: ({ url }: { url: string }): void => {
      loadUrlHandle
        .calledWith([url])
        .rejects(LoadUrlRecordedErrorStub({ code: 'ERR_FILE_NOT_FOUND', url }));
    },
    getLoadUrlCallsFor: ({ url }: { url: string }): RecordedCalls =>
      loadUrlHandle.callsMatching([url]),

    invokeResolves: ({
      channel,
      args,
      value,
    }: {
      channel: string;
      args: readonly unknown[];
      value: unknown;
    }): void => {
      invokeHandle.calledWith([channel, ...args]).resolves(value);
    },
    invokeNoHandler: ({ channel, args }: { channel: string; args: readonly unknown[] }): void => {
      invokeHandle
        .calledWith([channel, ...args])
        .rejects(
          IpcInvokeRecordedErrorStub({ channel, reply: `No handler registered for '${channel}'` }),
        );
    },
    invokeHandlerThrew: ({
      channel,
      args,
      message,
    }: {
      channel: string;
      args: readonly unknown[];
      message: string;
    }): void => {
      invokeHandle
        .calledWith([channel, ...args])
        .rejects(IpcInvokeRecordedErrorStub({ channel, reply: `Error: ${message}` }));
    },
    getInvokeCallsFor: ({ channel }: { channel: string }): RecordedCalls =>
      invokeHandle.callsMatching([channel]),

    // Delivers a message from main to every listener the renderer still has on the channel, the way
    // `webContents.send` would.
    emitToRenderer: ({ channel, args }: { channel: string; args: readonly unknown[] }): void => {
      for (const listener of electronDouble.registry.rendererListeners({ channel })) {
        listener({ sender: electronDouble.ipcRenderer }, ...args);
      }
    },
    getOnCallsFor: ({ channel }: { channel: string }): RecordedCalls =>
      onHandle.callsMatching([channel]),
    getRemoveAllListenersCallsFor: ({ channel }: { channel: string }): RecordedCalls =>
      removeHandle.callsMatching([channel]),

    // The API object the preload exposed under the key, or undefined when nothing was exposed there.
    getExposedApi: ({ key }: { key: string }): unknown =>
      electronDouble.registry.mainWorld().get(key),
    getExposeCallsFor: ({ key }: { key: string }): RecordedCalls =>
      exposeHandle.callsMatching([key]),

    setupDisplays: ({ displays }: { displays: readonly unknown[] }): void => {
      screenGetAllDisplaysHandle.calledWith([]).returns(displays as unknown[]);
    },
    setupWindowBounds: ({
      bounds,
    }: {
      bounds: { x: number; y: number; width: number; height: number };
    }): void => {
      windowGetBoundsHandle.calledWith([]).returns(bounds);
    },
    setupIsMaximized: ({ value }: { value: boolean }): void => {
      windowIsMaximizedHandle.calledWith([]).returns(value);
    },
    setupIsFullScreen: ({ value }: { value: boolean }): void => {
      windowIsFullScreenHandle.calledWith([]).returns(value);
    },
    emitWindowEvent: ({
      event,
      args = [],
    }: {
      event: string;
      args?: readonly unknown[];
    }): void => {
      for (const listener of electronDouble.registry.windowListeners({ event })) {
        listener(...args);
      }
    },
    getMaximizeCalls: (): RecordedCalls => windowMaximizeHandle.callsMatching([]),
    getSetFullScreenCalls: (): RecordedCalls => windowSetFullScreenHandle.callsMatching([]),
  };
};
