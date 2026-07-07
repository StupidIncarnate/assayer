import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

// Electron is unavailable in jest; replace the module with a minimal main-process double.
// BrowserWindow is a constructor (used with `new`), so it's a function returning a window double.
registerModuleMock({
  module: 'electron',
  factory: () => ({
    app: {
      whenReady: async () => Promise.resolve(),
      on: () => undefined,
      quit: () => undefined,
    },
    BrowserWindow: function BrowserWindow() {
      return { loadURL: async () => Promise.resolve() };
    },
    ipcMain: { handle: () => undefined },
  }),
});

export const electronDesktopBootAdapterProxy = (): Record<PropertyKey, never> => ({});
