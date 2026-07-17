import { ipcReplyContract } from './ipc-reply-contract';
import { IpcReplyStub } from './ipc-reply.stub';

describe('ipcReplyContract', () => {
  describe('valid replies', () => {
    it('VALID: {success: true, valueRaw: a payload} => passes the payload through untouched', () => {
      const result = ipcReplyContract.parse({ success: true, valueRaw: { verdicts: [] } });

      expect(result).toStrictEqual({ success: true, valueRaw: { verdicts: [] } });
    });

    // A saved run that has never been run is a legitimate `undefined` answer, so the envelope has to
    // survive carrying one — it is a successful reply, not a missing one.
    it('EMPTY: {success: true, valueRaw: undefined} => stays a SUCCESS carrying undefined', () => {
      const result = ipcReplyContract.parse({ success: true, valueRaw: undefined });

      expect(result).toStrictEqual({ success: true, valueRaw: undefined });
    });

    it('VALID: {success: false, message} => carries the message verbatim', () => {
      const result = ipcReplyContract.parse({
        success: false,
        message: 'assayer: the run produced no result for src/switch/pure-statement.ts.',
      });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: the run produced no result for src/switch/pure-statement.ts.',
      });
    });
  });

  describe('invalid replies', () => {
    // The whole point of the envelope is that a failure SAYS something; a failure arm with no message
    // would be a reply that reports nothing, which is the vague error P1 forbids.
    it('INVALID: {success: false} with no message => throws', () => {
      expect(() => ipcReplyContract.parse({ success: false })).toThrow(/message/u);
    });

    it('INVALID: {success: not a boolean literal} => throws', () => {
      expect(() => ipcReplyContract.parse({ success: 'nope' as never })).toThrow(/success/u);
    });
  });

  describe('IpcReplyStub()', () => {
    it('VALID: {no args} => builds a success reply carrying undefined', () => {
      expect(IpcReplyStub()).toStrictEqual({ success: true, valueRaw: undefined });
    });
  });
});
