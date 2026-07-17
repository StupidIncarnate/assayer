/**
 * PURPOSE: Reads the payload out of the IpcReply a main-process handler answered with, re-throwing a
 *   failed reply's message as an Error so a bridge method still REJECTS the way its callers expect.
 *
 *   This is not un-prefixing. The message crossed the wire as DATA, so Electron never attached
 *   `Error invoking remote method '<channel>': ` to it and there is nothing here to strip — the
 *   renderer gets the byte-identical text the main process wrote. Pulling that prefix back off raw
 *   text is the version of this that can be wrong, and it is why the failure is carried, not thrown.
 *
 * USAGE:
 * replyValueLayerAdapter({ reply: { success: true, valueRaw: 3 } });
 * // Returns 3 — or throws Error(message) when the reply is a failure
 */
import { ipcReplyContract } from '../../../contracts/ipc-reply/ipc-reply-contract';

export const replyValueLayerAdapter = ({ reply }: { reply: unknown }): unknown => {
  const parsed = ipcReplyContract.parse(reply);

  if (parsed.success) {
    return parsed.valueRaw;
  }

  throw new Error(parsed.message);
};
