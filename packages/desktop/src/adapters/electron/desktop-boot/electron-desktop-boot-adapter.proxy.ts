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
  // `passthrough` because the adapter's own call to `ipcMain.handle(channel, handler)` never reads
  // what `.handle()` returns — it registers a handler as a side effect. Passthrough calls the
  // module-mocked stub (`ipcMain: { handle: () => undefined }` above), which is a real no-op, exactly
  // like the un-staged jest.spyOn default this migrated off. Every call is still recorded regardless,
  // so handledChannels()/invokeHandler() above see it either way.
  const handleSpy = registerSpyOn({ object: ipcMain, method: 'handle', passthrough: true });
  // Handlers reply to their SENDER, so the invoked event carries a recording one — without it a
  // handler that pushes back to the window has nothing to push to.
  const sent: unknown[] = [];

  return {
    // Every registered channel, not one in particular — a legitimate blanket collector.
    handledChannels: (): unknown[] => handleSpy.callsMatching([]).map((call) => call[0]),
    sentToRenderer: (): unknown[] => sent,
    invokeHandler: async ({ channel, arg }: { channel: string; arg?: unknown }): Promise<unknown> => {
      const call = handleSpy.callsMatching([channel]).at(-1);
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
