/**
 * PURPOSE: Wraps the Electron preload contextBridge — exposes a typed `assayerBridge` on window
 *   whose methods invoke their respective IPC channels. The single preload-context I/O boundary.
 *
 *   `runFile` and `getSavedRun` stay separate all the way across the bridge for the same reason they
 *   are separate channels: reading what a file's last run said must never be able to start one.
 *
 *   `onRunOutput` HANDS BACK its own unsubscribe rather than exposing a remove-listener method: a
 *   renderer cannot pass the same function reference back across the contextBridge, so it could never
 *   name the listener it wanted removed. The unsubscribe clears the whole channel, which is exact
 *   rather than blunt only because this channel carries one thing to one subscriber.
 *
 * USAGE:
 * electronPreloadBridgeAdapter({
 *   bridgeKey: 'assayerBridge',
 *   statusChannel: 'assayer:status',
 *   compiledTreeChannel: 'assayer:compiled-tree',
 *   compiledFileChannel: 'assayer:compiled-file',
 *   stubsChannel: 'assayer:stubs',
 *   runChannel: 'assayer:run',
 *   savedRunChannel: 'assayer:saved-run',
 *   runOutputChannel: 'assayer:run-output',
 * });
 * // Returns { success: true } after exposing the bridge
 */
import { contextBridge, ipcRenderer } from 'electron';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { replyValueLayerAdapter } from './reply-value-layer-adapter';

export const electronPreloadBridgeAdapter = ({
  bridgeKey,
  statusChannel,
  compiledTreeChannel,
  compiledFileChannel,
  stubsChannel,
  runChannel,
  savedRunChannel,
  runOutputChannel,
}: {
  bridgeKey: string;
  statusChannel: string;
  compiledTreeChannel: string;
  compiledFileChannel: string;
  stubsChannel: string;
  runChannel: string;
  savedRunChannel: string;
  runOutputChannel: string;
}): AdapterResult => {
  contextBridge.exposeInMainWorld(bridgeKey, {
    getStatus: async (): Promise<unknown> =>
      replyValueLayerAdapter({ reply: await ipcRenderer.invoke(statusChannel) }),
    getCompiledTree: async (): Promise<unknown> =>
      replyValueLayerAdapter({ reply: await ipcRenderer.invoke(compiledTreeChannel) }),
    getCompiledFile: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerAdapter({ reply: await ipcRenderer.invoke(compiledFileChannel, relPath) }),
    getStubs: async (): Promise<unknown> =>
      replyValueLayerAdapter({ reply: await ipcRenderer.invoke(stubsChannel) }),
    runFile: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerAdapter({ reply: await ipcRenderer.invoke(runChannel, relPath) }),
    getSavedRun: async ({ relPath }: { relPath: string }): Promise<unknown> =>
      replyValueLayerAdapter({ reply: await ipcRenderer.invoke(savedRunChannel, relPath) }),
    onRunOutput: ({ onChunk }: { onChunk: (params: { chunk: string }) => void }): (() => void) => {
      ipcRenderer.on(runOutputChannel, (_event: unknown, chunk: unknown): void => {
        onChunk({ chunk: String(chunk) });
      });

      return (): void => {
        ipcRenderer.removeAllListeners(runOutputChannel);
      };
    },
  });

  return { success: true as const };
};
