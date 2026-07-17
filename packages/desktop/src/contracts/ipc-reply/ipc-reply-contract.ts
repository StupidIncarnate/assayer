/**
 * PURPOSE: Contract for what a main-process IPC handler answers with — either the resolver's payload,
 *   or the message it failed with, carried as DATA rather than thrown.
 *
 *   A failure travels as data because Electron's `ipcRenderer.invoke` builds its own rejection —
 *   `Error invoking remote method '<channel>': <error>` — from a flag `ipcMain.handle` sets whenever
 *   its handler throws. Nothing turns that text off, and it lands in front of error text written to
 *   tell an LLM exactly what to fix. A handler that ANSWERS with this contract never sets the flag,
 *   so the message the preload re-throws is byte-for-byte the one the broker wrote.
 *
 *   `valueRaw` is a deliberate passthrough: this contract validates the ENVELOPE, never the payload.
 *   Every channel carries a different shape, and each renderer-side adapter already parses the one it
 *   asked for into its own contract — re-stating those five shapes here would be a second encoding of
 *   them, which is the thing that lets two copies disagree.
 *
 * USAGE:
 * ipcReplyContract.parse({ success: true, valueRaw: { verdicts: [] } });
 * // Returns a validated IpcReply (discriminated on `success`)
 */
import { z } from 'zod';
import { errorMessageContract } from '@dungeonmaster/shared/contracts';

export const ipcReplyContract = z.discriminatedUnion('success', [
  z.object({ success: z.literal(true), valueRaw: z.unknown() }),
  z.object({ success: z.literal(false), message: errorMessageContract }),
]);

export type IpcReply = z.infer<typeof ipcReplyContract>;
