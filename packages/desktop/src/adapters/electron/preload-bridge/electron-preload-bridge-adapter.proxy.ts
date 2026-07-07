import { registerModuleMock } from '@dungeonmaster/testing/register-mock';

// Electron is unavailable in jest; replace the module with a minimal preload-context double.
registerModuleMock({
  module: 'electron',
  factory: () => ({
    contextBridge: { exposeInMainWorld: () => undefined },
    ipcRenderer: { invoke: async () => Promise.resolve(undefined) },
  }),
});

export const electronPreloadBridgeAdapterProxy = (): Record<PropertyKey, never> => ({});
