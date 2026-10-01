/**
 * PURPOSE: Validates the IpcReply a main-process handler answered with and hands back its success
 *   reply, whose `valueRaw` is the payload. A failed reply's message is re-thrown as an Error so a
 *   bridge method still REJECTS the way its callers expect.
 *
 *   This is not un-prefixing. The message crossed the wire as DATA, so Electron never attached
 *   `Error invoking remote method '<channel>': ` to it and there is nothing here to strip — the
 *   renderer gets the byte-identical text the main process wrote. Pulling that prefix back off raw
 *   text is the version of this that can be wrong, and it is why the failure is carried, not thrown.
 *
 * USAGE:
 * replyValueLayerBroker({ reply: { success: true, valueRaw: 3 } }).valueRaw;
 * // Returns 3 — or throws Error(message) when the reply is a failure
 */
import { ipcReplyContract } from '../../../contracts/ipc-reply/ipc-reply-contract';
import type { IpcReply } from '../../../contracts/ipc-reply/ipc-reply-contract';

export const replyValueLayerBroker = ({
  reply,
}: {
  reply: unknown;
}): Extract<IpcReply, { success: true }> => {
  const parsed = ipcReplyContract.parse(reply);

  if (parsed.success) {
    return parsed;
  }

  throw new Error(parsed.message);
};
