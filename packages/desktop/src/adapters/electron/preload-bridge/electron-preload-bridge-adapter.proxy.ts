import { contextBridge, ipcRenderer } from 'electron';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

// Electron is unavailable in jest; replace the module with a minimal preload-context double.
registerModuleMock({
  module: 'electron',
  factory: () => ({
    contextBridge: { exposeInMainWorld: () => undefined },
    ipcRenderer: { invoke: async () => Promise.resolve(undefined) },
  }),
});

export const electronPreloadBridgeAdapterProxy = (): {
  exposedBridgeKey: () => unknown;
  triggerGetCompiledTree: () => Promise<void>;
  triggerGetCompiledFile: ({ relPath }: { relPath: string }) => Promise<void>;
  triggerRunFile: ({ relPath }: { relPath: string }) => Promise<void>;
  triggerGetSavedRun: ({ relPath }: { relPath: string }) => Promise<void>;
  invokedChannels: () => unknown[];
  lastInvokeArgs: () => unknown[];
} => {
  const exposeSpy = registerSpyOn({ object: contextBridge, method: 'exposeInMainWorld' });
  const invokeSpy = registerSpyOn({ object: ipcRenderer, method: 'invoke' });
  invokeSpy.mockResolvedValue(undefined);

  const getApi = (): Record<PropertyKey, (arg?: unknown) => Promise<unknown>> | undefined =>
    exposeSpy.mock.calls.at(-1)?.[1] as
      | Record<PropertyKey, (arg?: unknown) => Promise<unknown>>
      | undefined;

  return {
    exposedBridgeKey: (): unknown => exposeSpy.mock.calls.at(-1)?.[0],
    triggerGetCompiledTree: async (): Promise<void> => {
      await getApi()?.getCompiledTree?.();
    },
    triggerGetCompiledFile: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.getCompiledFile?.({ relPath });
    },
    triggerRunFile: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.runFile?.({ relPath });
    },
    triggerGetSavedRun: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.getSavedRun?.({ relPath });
    },
    invokedChannels: (): unknown[] => invokeSpy.mock.calls.map((call) => call[0]),
    lastInvokeArgs: (): unknown[] => invokeSpy.mock.calls.at(-1) ?? [],
  };
};
