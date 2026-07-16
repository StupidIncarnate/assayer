import { ipcMain } from 'electron';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

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
    Menu: { setApplicationMenu: () => undefined },
    ipcMain: { handle: () => undefined },
  }),
});

export const electronDesktopBootAdapterProxy = (): {
  handledChannels: () => unknown[];
  invokeHandler: (params: { channel: string; arg?: unknown }) => Promise<unknown>;
  sentToRenderer: () => unknown[];
} => {
  const handleSpy = registerSpyOn({ object: ipcMain, method: 'handle' });
  // Handlers reply to their SENDER, so the invoked event carries a recording one — without it a
  // handler that pushes back to the window has nothing to push to.
  const sent: unknown[] = [];

  return {
    handledChannels: (): unknown[] => handleSpy.mock.calls.map((call) => call[0]),
    sentToRenderer: (): unknown[] => sent,
    invokeHandler: async ({ channel, arg }: { channel: string; arg?: unknown }): Promise<unknown> => {
      const call = handleSpy.mock.calls.find((entry) => entry[0] === channel);
      const handler = call?.[1] as ((event: unknown, arg?: unknown) => unknown) | undefined;
      if (handler === undefined) {
        throw new Error(`No handler registered for channel: ${channel}`);
      }
      return await handler(
        {
          sender: {
            send: (sendChannel: unknown, payload: unknown): void => {
              sent.push([sendChannel, payload]);
            },
          },
        },
        arg,
      );
    },
  };
};
