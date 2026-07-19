import { ipcReplyTransformer } from './ipc-reply-transformer';

// Typed `unknown` because that is exactly what a caught value is: something threw, and nothing
// promised it was an Error.
const A_THROWN_NON_ERROR: unknown = 'a bare string';

describe('ipcReplyTransformer', () => {
  describe('resolvers that answer', () => {
    it('VALID: {resolve returns a payload} => wraps it as a success reply', async () => {
      const result = await ipcReplyTransformer({ resolve: async () => Promise.resolve({ verdicts: [] }) });

      expect(result).toStrictEqual({ success: true, valueRaw: { verdicts: [] } });
    });

    // getSavedRun answers `undefined` for a file nobody has run yet. That is a successful reply about
    // nothing, not a failure, and collapsing the two would make "never run" indistinguishable from
    // "the run broke".
    it('EMPTY: {resolve returns undefined} => stays a SUCCESS carrying undefined', async () => {
      const result = await ipcReplyTransformer({ resolve: async () => Promise.resolve(undefined) });

      expect(result).toStrictEqual({ success: true, valueRaw: undefined });
    });
  });

  describe('resolvers that fail', () => {
    // THE regression guard, at the unit that owns the rule: the P1 text arrives as the message, whole
    // and unadorned. If this ever throws instead of returning, Electron prefixes the text in the
    // renderer and the UI shows a stack-trace costume over the sentence the broker wrote.
    it('ERROR: {resolve rejects with a P1 Error} => RETURNS the message verbatim instead of throwing', async () => {
      const result = await ipcReplyTransformer({
        resolve: async () =>
          Promise.reject(
            new Error('assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.\n\nCannot find run.json'),
          ),
      });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.\n\nCannot find run.json',
      });
    });

    // A resolver that throws before it ever returns a promise must not escape either — the try has to
    // cover the CALL, not just the await.
    it('ERROR: {resolve throws synchronously} => still returns a failure reply rather than throwing', async () => {
      const result = await ipcReplyTransformer({
        resolve: () => {
          throw new Error('assayer: the CLI is not built, so nothing can be run. Build it and try again.');
        },
      });

      expect(result).toStrictEqual({
        success: false,
        message: 'assayer: the CLI is not built, so nothing can be run. Build it and try again.',
      });
    });

    it('ERROR: {resolve throws a non-Error} => names that instead of paraphrasing the value', async () => {
      const result = await ipcReplyTransformer({
        resolve: () => {
          throw A_THROWN_NON_ERROR;
        },
      });

      expect(result).toStrictEqual({
        success: false,
        message:
          'assayer: the desktop main process failed with a value that is not an Error, so it carries no message. Throw an Error whose message says what failed.',
      });
    });
  });
});
