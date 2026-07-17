import { ipcReplyContract } from './ipc-reply-contract';
import type { IpcReply } from './ipc-reply-contract';

export const IpcReplyStub = (): IpcReply => ipcReplyContract.parse({ success: true, valueRaw: undefined });
