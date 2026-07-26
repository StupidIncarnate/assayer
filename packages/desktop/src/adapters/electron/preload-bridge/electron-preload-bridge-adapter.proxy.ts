import { contextBridge, ipcRenderer } from 'electron';
import { registerModuleMock, registerSpyOn } from '@dungeonmaster/testing/register-mock';

import { replyValueLayerAdapterProxy } from './reply-value-layer-adapter.proxy';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

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
  triggerGetMergedView: () => Promise<void>;
  triggerRunFile: ({ relPath }: { relPath: string }) => Promise<unknown>;
  triggerGetSavedRun: ({ relPath }: { relPath: string }) => Promise<void>;
  triggerGetSavedConsole: ({ relPath }: { relPath: string }) => Promise<void>;
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

  // `passthrough` on expose/on/removeAllListeners because none of their return values is ever read —
  // the adapter calls them for their side effect (registering the bridge, subscribing, unsubscribing).
  // Passthrough calls each module-mocked stub above, a real no-op, exactly like the un-staged
  // jest.spyOn default this migrated off. Every call is still recorded regardless, so getApi() and the
  // channel collectors below see it either way. `invoke`'s answer IS read, so it stays fully staged
  // instead — passthrough would return `undefined` from the stub, a shape main can never actually send.
  const exposeSpy = registerSpyOn({ object: contextBridge, method: 'exposeInMainWorld', passthrough: true });
  const invokeSpy = registerSpyOn({ object: ipcRenderer, method: 'invoke' });
  const onSpy = registerSpyOn({ object: ipcRenderer, method: 'on', passthrough: true });
  const removeSpy = registerSpyOn({ object: ipcRenderer, method: 'removeAllListeners', passthrough: true });
  // Main answers with an IpcReply on every channel, never a bare payload, so the default has to be a
  // reply too — a bare `undefined` here would be a shape main cannot send, and every bridge method
  // would reject on it. `calledWith([])` matches every channel, since this default deliberately
  // answers the same generic reply regardless which of the six invoke channels called it.
  invokeSpy.calledWith([]).resolves({ success: true, valueRaw: undefined });

  // The proxy subscribes and records, so a test never needs its own collector to see what arrived.
  const state: { unsubscribe: (() => void) | undefined; chunks: unknown[] } = {
    unsubscribe: undefined,
    chunks: [],
  };

  // Matched on the one bridge key production ever exposes (desktopBridgeStatics.bridge.key, the same
  // constant desktop-preload-expose-responder hands the real adapter). A caller wiring the wrong key
  // throws "nothing set up for the call" instead of this proxy silently handing back whatever
  // exposeInMainWorld call happened to run last.
  const getApi = (): Record<PropertyKey, (arg?: unknown) => unknown> | undefined =>
    exposeSpy.callsMatching([desktopBridgeStatics.bridge.key]).at(-1)?.[1] as
      | Record<PropertyKey, (arg?: unknown) => unknown>
      | undefined;

  return {
    // Diagnostic: reports whatever key WAS exposed, so it stays unfiltered — matching on the expected
    // key here would hide a wrong-key bug instead of surfacing it.
    exposedBridgeKey: (): unknown => exposeSpy.callsMatching([]).at(-1)?.[0],
    mainAnswers: ({ valueRaw }: { valueRaw: unknown }): void => {
      invokeSpy.calledWith([]).resolves({ success: true, valueRaw });
    },
    // Stands up a main process that FAILED. The message travels as data because that is what main
    // does — so a test asserting what the renderer sees is asserting the real wire shape.
    mainFails: ({ message }: { message: string }): void => {
      invokeSpy.calledWith([]).resolves({ success: false, message });
    },
    triggerGetCompiledTree: async (): Promise<void> => {
      await getApi()?.getCompiledTree?.();
    },
    triggerGetCompiledFile: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.getCompiledFile?.({ relPath });
    },
    triggerGetMergedView: async (): Promise<void> => {
      await getApi()?.getStubs?.();
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
    triggerGetSavedConsole: async ({ relPath }: { relPath: string }): Promise<void> => {
      await getApi()?.getSavedConsole?.({ relPath });
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
    // Drives the listener the preload registered the way main's send would. Matched on the one
    // channel `.on()` is ever called with (desktopBridgeStatics.channels.runOutput), so a caller
    // wiring the wrong channel throws instead of this proxy driving whatever listener registered last.
    emitRunOutput: ({ chunk }: { chunk: unknown }): void => {
      const listener = onSpy.callsMatching([desktopBridgeStatics.channels.runOutput]).at(-1)?.[1] as
        | ((event: unknown, chunk: unknown) => void)
        | undefined;
      listener?.(undefined, chunk);
    },
    // Collectors: every subscribe/unsubscribe/invoke call regardless of channel, a real question a
    // test asks about the whole sequence, not a narrowed one.
    subscribedChannels: (): unknown[] => onSpy.callsMatching([]).map((call) => call[0]),
    removedChannels: (): unknown[] => removeSpy.callsMatching([]).map((call) => call[0]),
    invokedChannels: (): unknown[] => invokeSpy.callsMatching([]).map((call) => call[0]),
    // Whatever channel ran last — the channel itself is what the caller is discovering, so filtering
    // by channel here would be circular. A test comparing the FULL args (channel plus payload) is what
    // catches a wrong-channel bug; a two-invoke test (getCompiledTree then getCompiledFile) needs this
    // unfiltered to see each call's own channel in turn.
    lastInvokeArgs: (): unknown[] => invokeSpy.callsMatching([]).at(-1) ?? [],
  };
};
