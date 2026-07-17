/**
 * PURPOSE: Runs one IPC resolver and answers with an IpcReply — the payload when it resolves, the
 *   Error's own message when it throws. It never throws, and that is its whole job.
 *
 *   Electron builds `Error invoking remote method '<channel>': <error>` in the RENDERER, out of a flag
 *   it sets only when a main-process handler throws; no option turns that text off. So the one way P1
 *   error text reaches the UI unprefixed is for the handler to RETURN its failure instead of throwing
 *   it. Every `ipcMain.handle` registration resolves through here, which is what makes the prefix
 *   unrepresentable rather than scrubbed afterwards: no resolver can re-open it, whatever it throws.
 *
 * USAGE:
 * await ipcReplyTransformer({ resolve: async () => runExecuteBroker({ repoPath, root, relPath }) });
 * // Returns { success: true, valueRaw } — or { success: false, message } when resolve threw
 */
import { ipcReplyContract } from '../../contracts/ipc-reply/ipc-reply-contract';
import type { IpcReply } from '../../contracts/ipc-reply/ipc-reply-contract';

// A thrown non-Error carries no message to forward. Naming that is honest; paraphrasing whatever it
// stringifies to would invent product surface out of a coercion.
const NON_ERROR_MESSAGE =
  'assayer: the desktop main process failed with a value that is not an Error, so it carries no message. Throw an Error whose message says what failed.';

export const ipcReplyTransformer = async ({
  resolve,
}: {
  resolve: () => Promise<unknown>;
}): Promise<IpcReply> => {
  try {
    return ipcReplyContract.parse({ success: true, valueRaw: await resolve() });
  } catch (error: unknown) {
    return ipcReplyContract.parse({
      success: false,
      message: error instanceof Error ? error.message : NON_ERROR_MESSAGE,
    });
  }
};
