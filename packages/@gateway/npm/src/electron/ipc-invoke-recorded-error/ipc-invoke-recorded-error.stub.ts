/**
 * PURPOSE: The error a real `ipcRenderer.invoke` rejects with when the main process answers with an
 * error, held as data so a proxy can stage it with no main process. Electron 32 builds it in
 * `lib/renderer/api/ipc-renderer.ts` as `Error invoking remote method '<channel>': <reply>`. The
 * reply is the main process's error turned into a string. A channel with no handler replies
 * `No handler registered for '<channel>'`. A handler that throws replies with its error's
 * `toString()`, such as `Error: boom`.
 *
 * USAGE:
 * IpcInvokeRecordedErrorStub({ channel: 'assayer:status', reply: "No handler registered for 'assayer:status'" });
 * // Returns an Error with message "Error invoking remote method 'assayer:status': No handler registered for 'assayer:status'"
 */

export const IpcInvokeRecordedErrorStub = ({
  channel,
  reply,
}: {
  channel: string;
  reply: string;
}): Error => new Error(`Error invoking remote method '${channel}': ${reply}`);
