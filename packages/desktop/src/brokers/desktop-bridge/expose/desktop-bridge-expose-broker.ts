/**
 * PURPOSE: Wraps the Electron preload contextBridge — exposes a typed `assayerBridge` on window
 *   whose methods invoke their respective IPC channels. The single preload-context I/O boundary.
 *
 *   `runFile`, `getSavedRun` and `getSavedConsole` stay separate all the way across the bridge for the
 *   same reason they are separate channels: reading what a file's last run said, or wrote, must never
 *   be able to start one.
 *
 *   `onRunOutput` HANDS BACK its own unsubscribe rather than exposing a remove-listener method: a
 *   renderer cannot pass the same function reference back across the contextBridge, so it could never
 *   name the listener it wanted removed. The unsubscribe clears the whole channel, which is exact
 *   rather than blunt only because this channel carries one thing to one subscriber.
 *
 * USAGE:
 * desktopBridgeExposeBroker({
 *   bridgeKey: 'assayerBridge',
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
 *   stubsChannel: 'assayer:stubs',
 *   runChannel: 'assayer:run',
 *   savedRunChannel: 'assayer:saved-run',
 *   savedConsoleChannel: 'assayer:saved-console',
 *   runOutputChannel: 'assayer:run-output',
 * });
 * // Exposes window.assayerBridge in the preload context
 */
import { contextBridge, ipcRenderer } from '#gateway/npm/electron';

import { replyValueLayerBroker } from './reply-value-layer-broker';

export const desktopBridgeExposeBroker = ({
  bridgeKey,
  statusChannel,
  compiledTreeChannel,
  compiledFileChannel,
  stubsChannel,
  runChannel,
  savedRunChannel,
  savedConsoleChannel,
  runOutputChannel,
}: {
  bridgeKey: string;
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
  stubsChannel: string;
  runChannel: string;
  savedRunChannel: string;
  savedConsoleChannel: string;
  runOutputChannel: string;
}): void => {
  contextBridge.exposeInMainWorld(bridgeKey, {
    getStatus: async (): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(statusChannel) }).valueRaw,
    getCompiledTree: async (): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(compiledTreeChannel) }).valueRaw,
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(compiledFileChannel, relPath) })
        .valueRaw,
    getStubs: async (): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(stubsChannel) }).valueRaw,
    runFile: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(runChannel, relPath) }).valueRaw,
    getSavedRun: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(savedRunChannel, relPath) })
        .valueRaw,
    getSavedConsole: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerBroker({ reply: await ipcRenderer.invoke(savedConsoleChannel, relPath) })
        .valueRaw,
    onRunOutput: ({ onChunk }: { onChunk: (params: { chunk: string }) => void }): (() => void) => {
      ipcRenderer.on(runOutputChannel, (_event: unknown, chunk: unknown): void => {
        onChunk({ chunk: String(chunk) });
      });

      return (): void => {
        ipcRenderer.removeAllListeners(runOutputChannel);
      };
    },
  });
};
