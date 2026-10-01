import { electronProxy } from '#gateway/npm/electron/electron.proxy';

import { replyValueLayerBrokerProxy } from './reply-value-layer-broker.proxy';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

export const desktopBridgeExposeBrokerProxy = (): {
  exposedBridgeKeys: () => unknown[];
  mainAnswers: ({ channel, valueRaw }: { channel: string; valueRaw: unknown }) => void;
  mainFails: ({ channel, message }: { channel: string; message: string }) => void;
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
  invokedArgsFor: ({ channel }: { channel: string }) => unknown[][];
} => {
  // Bare-invoked: the unwrap layer is pure, so it runs REAL here — a test asserting what the bridge
  // answers is asserting the real envelope being read, not a double of it.
  replyValueLayerBrokerProxy();

  const electronGateway = electronProxy();

  // Main answers with an IpcReply on every channel, never a bare payload, so the default has to be a
  // reply too — a bare `undefined` here would be a shape main cannot send, and every bridge method
  // would reject on it. Each request channel gets the generic reply, addressed by its own name. The
  // run-output channel is a push channel that is subscribed to, never invoked.
  const requestChannels = [
    desktopBridgeStatics.channels.status,
    desktopBridgeStatics.channels.compiledTree,
    desktopBridgeStatics.channels.compiledFile,
    desktopBridgeStatics.channels.stubs,
    desktopBridgeStatics.channels.run,
    desktopBridgeStatics.channels.savedRun,
    desktopBridgeStatics.channels.savedConsole,
  ];
  for (const channel of requestChannels) {
    electronGateway.invokeResolves({
      channel,
      args: [],
      value: { success: true, valueRaw: undefined },
    });
  }

  // The proxy subscribes and records, so a test never needs its own collector to see what arrived.
  const state: { unsubscribe: (() => void) | undefined; chunks: unknown[] } = {
    unsubscribe: undefined,
    chunks: [],
  };

  // Matched on the one bridge key production ever exposes (desktopBridgeStatics.bridge.key, the same
  // constant desktop-preload-expose-responder hands the real broker). A caller wiring the wrong key
  // finds no API instead of this proxy handing back whatever was exposed last.
  const getApi = (): Record<PropertyKey, (arg?: unknown) => unknown> | undefined =>
    electronGateway.getExposedApi({ key: desktopBridgeStatics.bridge.key }) as
      | Record<PropertyKey, (arg?: unknown) => unknown>
      | undefined;

  return {
    // The broker exposes exactly once, so a test asserts this whole list and sees a second, unwanted
    // expose call under the production key too.
    exposedBridgeKeys: (): unknown[] =>
      electronGateway
        .getExposeCallsFor({ key: desktopBridgeStatics.bridge.key })
        .map((call) => call[0]),
    mainAnswers: ({ channel, valueRaw }: { channel: string; valueRaw: unknown }): void => {
      electronGateway.invokeResolves({ channel, args: [], value: { success: true, valueRaw } });
    },
    // Stands up a main process that FAILED. The message travels as data because that is what main
    // does — so a test asserting what the renderer sees is asserting the real wire shape.
    mainFails: ({ channel, message }: { channel: string; message: string }): void => {
      electronGateway.invokeResolves({ channel, args: [], value: { success: false, message } });
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
    // Delivers a message from main on the run-output channel, the way main's `send` would. It reaches
    // only the listeners still subscribed to that channel.
    emitRunOutput: ({ chunk }: { chunk: unknown }): void => {
      electronGateway.emitToRenderer({
        channel: desktopBridgeStatics.channels.runOutput,
        args: [chunk],
      });
    },
    // Collectors: every subscribe and unsubscribe call on the run-output channel, the only channel the
    // bridge listens on.
    subscribedChannels: (): unknown[] =>
      electronGateway
        .getOnCallsFor({ channel: desktopBridgeStatics.channels.runOutput })
        .map((call) => call[0]),
    removedChannels: (): unknown[] =>
      electronGateway
        .getRemoveAllListenersCallsFor({ channel: desktopBridgeStatics.channels.runOutput })
        .map((call) => call[0]),
    // Every invoke call on one channel with its FULL arguments (channel plus payload), in the order
    // they happened.
    invokedArgsFor: ({ channel }: { channel: string }): unknown[][] =>
      electronGateway.getInvokeCallsFor({ channel }).map((call) => [...call]),
  };
};
