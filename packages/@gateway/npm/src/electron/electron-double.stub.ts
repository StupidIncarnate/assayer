/**
 * PURPOSE: The one set of stand-in Electron objects every Jest test sees in place of the real
 * module. `electron.jest-mock.cjs` serves these objects for `#gateway/npm/electron`, and
 * `electronProxy` spies on the same objects, so what a test stages is exactly what the code under
 * test calls. Every call answers the same instance, because the code under test and the proxy must
 * share it.
 *
 * The double keeps the state rules Electron itself enforces: one `ipcMain` handler per channel, one
 * `exposeInMainWorld` per key, and listeners that `removeAllListeners` really removes. That state
 * lives in the call records of `jest.fn` logs, which the Jest setup resets after every test, so each
 * test starts with no handler, no listener and no exposed API. A call whose answer matters
 * (`ipcRenderer.invoke`, a window's `loadURL`) has no answer of its own, so it throws a message
 * naming `electronProxy`. A caller's test never uses this; it composes `electronProxy`.
 *
 * USAGE:
 * ElectronDoubleStub().ipcMain.handle('assayer:status', handler);
 * ElectronDoubleStub().registry.invokeHandlers();
 * // Returns Map { 'assayer:status' => handler }
 */

const handleLog = jest.fn(
  (_channel: string, _handler: (event: unknown, ...args: readonly unknown[]) => unknown): void =>
    undefined,
);
const rendererLog = jest.fn(
  (
    _change: 'on' | 'removeAllListeners',
    _channel: string,
    _listener?: (event: unknown, ...args: readonly unknown[]) => void,
  ): void => undefined,
);
const appLog = jest.fn(
  (_event: string, _listener: (...args: readonly unknown[]) => void): void => undefined,
);
const windowLog = jest.fn(
  (_event: string, _listener: (...args: readonly unknown[]) => void): void => undefined,
);
const exposeLog = jest.fn((_key: string, _api: unknown): void => undefined);

const registry = {
  invokeHandlers: (): Map<string, (event: unknown, ...args: readonly unknown[]) => unknown> =>
    new Map(handleLog.mock.calls),
  // Replays every `on` and `removeAllListeners` in order, so a removal drops only what came before it.
  rendererListeners: ({
    channel,
  }: {
    channel: string;
  }): ((event: unknown, ...args: readonly unknown[]) => void)[] =>
    rendererLog.mock.calls.reduce<((event: unknown, ...args: readonly unknown[]) => void)[]>(
      (listeners, [change, loggedChannel, listener]) => {
        if (loggedChannel !== channel) {
          return listeners;
        }
        if (change === 'removeAllListeners' || listener === undefined) {
          return [];
        }

        return [...listeners, listener];
      },
      [],
    ),
  appListeners: ({ event }: { event: string }): ((...args: readonly unknown[]) => void)[] =>
    appLog.mock.calls
      .filter(([loggedEvent]) => loggedEvent === event)
      .map(([, listener]) => listener),
  windowListeners: ({ event }: { event: string }): ((...args: readonly unknown[]) => void)[] =>
    windowLog.mock.calls
      .filter(([loggedEvent]) => loggedEvent === event)
      .map(([, listener]) => listener),
  mainWorld: (): Map<string, unknown> => new Map(exposeLog.mock.calls),
};

const electronDouble = {
  registry,

  // What `import electronBinaryPath from 'electron'` reads. The mock serves `default` through a
  // getter that calls this, so a proxy can change the answer per test.
  executablePath: {
    read: (): unknown => '/electron-jest-double/electron',
  },

  app: {
    whenReady: async (): Promise<void> => Promise.resolve(),
    on: (event: string, listener: (...args: readonly unknown[]) => void): unknown => {
      appLog(event, listener);

      return electronDouble.app;
    },
    quit: (): void => undefined,
  },

  Menu: {
    setApplicationMenu: (_menu: unknown): void => undefined,
  },

  screen: {
    getAllDisplays: (): unknown[] => [
      {
        id: 1,
        bounds: { x: 0, y: 0, width: 1920, height: 1080 },
        workArea: { x: 0, y: 0, width: 1920, height: 1040 },
        scaleFactor: 1,
        rotation: 0,
        internal: true,
        monochrome: false,
        accelerometerSupport: 'unknown',
        colorDepth: 24,
        colorSpace: 'srgb',
        depthPerComponent: 8,
        detected: true,
        displayFrequency: 60,
        label: 'Primary Display',
        maximumCursorSize: { width: 32, height: 32 },
        nativeOrigin: { x: 0, y: 0 },
        size: { width: 1920, height: 1080 },
        touchSupport: 'unknown',
        workAreaSize: { width: 1920, height: 1040 },
      },
    ],
  },

  // The mock's `BrowserWindow` constructor calls `created` with its options, and every window's
  // `loadURL` calls `loadURL` here, so one spy sees every window.
  browserWindow: {
    created: (_options: unknown): void => undefined,
    loadURL: async (url: string): Promise<void> =>
      Promise.reject(
        new Error(
          `electron double: BrowserWindow.loadURL('${url}') has no staged answer. Compose electronProxy from '#gateway/npm/electron/electron.proxy' and stage it with loadUrlResolves.`,
        ),
      ),
    on: (event: string, listener: (...args: readonly unknown[]) => void): unknown => {
      windowLog(event, listener);

      return electronDouble.browserWindow;
    },
    getBounds: (): { x: number; y: number; width: number; height: number } => ({
      x: 0,
      y: 0,
      width: 1500,
      height: 800,
    }),
    isMaximized: (): boolean => false,
    isFullScreen: (): boolean => false,
    maximize: (): void => undefined,
    setFullScreen: (_flag: boolean): void => undefined,
  },

  ipcMain: {
    handle: (
      channel: string,
      handler: (event: unknown, ...args: readonly unknown[]) => unknown,
    ): void => {
      if (registry.invokeHandlers().has(channel)) {
        throw new Error(`Attempted to register a second handler for '${channel}'`);
      }
      handleLog(channel, handler);
    },
  },

  // The `sender` of every event `electronProxy.invokeHandler` hands an `ipcMain` handler.
  webContents: {
    send: (_channel: string, ..._args: readonly unknown[]): void => undefined,
  },

  ipcRenderer: {
    invoke: async (channel: string, ..._args: readonly unknown[]): Promise<unknown> =>
      Promise.reject(
        new Error(
          `electron double: ipcRenderer.invoke('${channel}') has no staged answer. Compose electronProxy from '#gateway/npm/electron/electron.proxy' and stage it with invokeResolves.`,
        ),
      ),
    on: (channel: string, listener: (event: unknown, ...args: readonly unknown[]) => void): unknown => {
      rendererLog('on', channel, listener);

      return electronDouble.ipcRenderer;
    },
    removeAllListeners: (channel: string): unknown => {
      rendererLog('removeAllListeners', channel);

      return electronDouble.ipcRenderer;
    },
  },

  contextBridge: {
    exposeInMainWorld: (key: string, api: unknown): void => {
      if (registry.mainWorld().has(key)) {
        throw new Error('Cannot bind an API on top of an existing property on the window object');
      }
      exposeLog(key, api);
    },
  },
};

export const ElectronDoubleStub = (): typeof electronDouble => electronDouble;
