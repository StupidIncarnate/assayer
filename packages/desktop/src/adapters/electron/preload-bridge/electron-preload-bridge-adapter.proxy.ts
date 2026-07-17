import { contextBridge, ipcRenderer } from 'electron';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { replyValueLayerAdapterProxy } from './reply-value-layer-adapter.proxy';

// Electron is unavailable in jest; replace the module with a minimal preload-context double.
// `on`/`removeAllListeners` are part of it because the bridge does not only invoke: run output is
// PUSHED from main, so the preload subscribes as well as asks.
registerModuleMock({
  module: 'electron',
  factory: () => ({
    contextBridge: { exposeInMainWorld: () => undefined },
    ipcRenderer: {
      invoke: async () => Promise.resolve(undefined),
      on: () => undefined,
      removeAllListeners: () => undefined,
    },
  }),
});

export const electronPreloadBridgeAdapterProxy = (): {
  exposedBridgeKey: () => unknown;
  mainAnswers: ({ valueRaw }: { valueRaw: unknown }) => void;
  mainFails: ({ message }: { message: string }) => void;
  triggerGetCompiledTree: () => Promise<void>;
  triggerGetCompiledFile: ({ relPath }: { relPath: string }) => Promise<void>;
  triggerRunFile: ({ relPath }: { relPath: string }) => Promise<unknown>;
  triggerGetSavedRun: ({ relPath }: { relPath: string }) => Promise<void>;
  triggerOnRunOutput: () => void;
  triggerUnsubscribeRunOutput: () => void;
  emitRunOutput: ({ chunk }: { chunk: unknown }) => void;
  receivedChunks: () => unknown[];
  subscribedChannels: () => unknown[];
  removedChannels: () => unknown[];
  invokedChannels: () => unknown[];
  lastInvokeArgs: () => unknown[];
} => {
  // Bare-invoked: the unwrap layer is pure, so it runs REAL here — a test asserting what the bridge
  // answers is asserting the real envelope being read, not a double of it.
  replyValueLayerAdapterProxy();

  const exposeSpy = registerSpyOn({ object: contextBridge, method: 'exposeInMainWorld' });
  const invokeSpy = registerSpyOn({ object: ipcRenderer, method: 'invoke' });
  const onSpy = registerSpyOn({ object: ipcRenderer, method: 'on' });
  const removeSpy = registerSpyOn({ object: ipcRenderer, method: 'removeAllListeners' });
  // Main answers with an IpcReply on every channel, never a bare payload, so the default has to be a
  // reply too — a bare `undefined` here would be a shape main cannot send, and every bridge method
  // would reject on it.
  invokeSpy.mockResolvedValue({ success: true, valueRaw: undefined });

  // The proxy subscribes and records, so a test never needs its own collector to see what arrived.
  const state: { unsubscribe: (() => void) | undefined; chunks: unknown[] } = {
    unsubscribe: undefined,
    chunks: [],
  };

  const getApi = (): Record<PropertyKey, (arg?: unknown) => unknown> | undefined =>
    exposeSpy.mock.calls.at(-1)?.[1] as Record<PropertyKey, (arg?: unknown) => unknown> | undefined;

  return {
    exposedBridgeKey: (): unknown => exposeSpy.mock.calls.at(-1)?.[0],
    mainAnswers: ({ valueRaw }: { valueRaw: unknown }): void => {
      invokeSpy.mockResolvedValue({ success: true, valueRaw });
    },
    // Stands up a main process that FAILED. The message travels as data because that is what main
    // does — so a test asserting what the renderer sees is asserting the real wire shape.
    mainFails: ({ message }: { message: string }): void => {
      invokeSpy.mockResolvedValue({ success: false, message });
    },
    triggerGetCompiledTree: async (): Promise<void> => {
      await getApi()?.getCompiledTree?.();
    },
    triggerGetCompiledFile: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.getCompiledFile?.({ relPath });
    },
    // Hands back what the bridge answered (and rejects with what it threw), because for run the
    // ANSWER is the thing under test: a failed run's message is product surface, not a side effect.
    triggerRunFile: async ({ relPath }: { relPath: string }): Promise<unknown> => {
      const answer: unknown = await getApi()?.runFile?.({ relPath });

      return answer;
    },
    triggerGetSavedRun: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.getSavedRun?.({ relPath });
    },
    triggerOnRunOutput: (): void => {
      state.unsubscribe = getApi()?.onRunOutput?.({
        onChunk: ({ chunk }: { chunk: string }): void => {
          state.chunks.push(chunk);
        },
      }) as (() => void) | undefined;
    },
    receivedChunks: (): unknown[] => state.chunks,
    triggerUnsubscribeRunOutput: (): void => {
      state.unsubscribe?.();
    },
    // Drives the listener the preload registered the way main's send would.
    emitRunOutput: ({ chunk }: { chunk: unknown }): void => {
      const listener = onSpy.mock.calls.at(-1)?.[1] as
        | ((event: unknown, chunk: unknown) => void)
        | undefined;
      listener?.(undefined, chunk);
    },
    subscribedChannels: (): unknown[] => onSpy.mock.calls.map((call) => call[0]),
    removedChannels: (): unknown[] => removeSpy.mock.calls.map((call) => call[0]),
    invokedChannels: (): unknown[] => invokeSpy.mock.calls.map((call) => call[0]),
    lastInvokeArgs: (): unknown[] => invokeSpy.mock.calls.at(-1) ?? [],
  };
};
