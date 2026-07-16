/**
 * WHY MOCK THE WINDOW GLOBAL: the adapter's I/O boundary is window.assayerBridge.onRunOutput — the
 * contextBridge subscription the Electron preload injects. jsdom has no such global, so the proxy
 * stands it up and MERGES onto any existing window.assayerBridge so it composes with the other
 * bridge-method proxies. `emit` drives the subscriber the way a running CLI would, and absent()
 * removes the method to exercise the missing-preload path.
 */
export const assayerBridgeOnRunOutputAdapterProxy = (): {
  emit: (params: { chunk: string }) => void;
  hasUnsubscribed: () => boolean;
  absent: () => void;
} => {
  const state: {
    subscribers: ((params: { chunk: string }) => void)[];
    unsubscribed: boolean;
  } = { subscribers: [], unsubscribed: false };

  window.assayerBridge = {
    ...window.assayerBridge,
    onRunOutput: ({ onChunk }: { onChunk: (params: { chunk: string }) => void }): (() => void) => {
      state.subscribers.push(onChunk);

      return (): void => {
        state.unsubscribed = true;
      };
    },
  };

  return {
    emit: ({ chunk }: { chunk: string }): void => {
      state.subscribers.forEach((subscriber) => {
        subscriber({ chunk });
      });
    },
    hasUnsubscribed: (): boolean => state.unsubscribed,
    absent: (): void => {
      const bridge = window.assayerBridge;
      if (bridge !== undefined) {
        Reflect.deleteProperty(bridge, 'onRunOutput');
      }
    },
  };
};
