import { replyValueLayerAdapter } from './reply-value-layer-adapter';
import { replyValueLayerAdapterProxy } from './reply-value-layer-adapter.proxy';

describe('replyValueLayerAdapter', () => {
  describe('successful replies', () => {
    it('VALID: {success reply carrying a payload} => returns the payload', () => {
      replyValueLayerAdapterProxy();

      const result = replyValueLayerAdapter({ reply: { success: true, valueRaw: { verdicts: [] } } });

      expect(result).toStrictEqual({ verdicts: [] });
    });

    it('EMPTY: {success reply carrying undefined} => returns undefined rather than throwing', () => {
      replyValueLayerAdapterProxy();

      const result = replyValueLayerAdapter({ reply: { success: true, valueRaw: undefined } });

      expect(result).toBe(undefined);
    });
  });

  describe('failed replies', () => {
    // The renderer half of the regression guard: the message the main process carried over as data is
    // re-thrown EXACTLY, so what reaches the UI is the sentence the broker wrote — not that sentence
    // wearing `Error invoking remote method 'assayer:run': Error: ` in front of it.
    it('ERROR: {failure reply} => throws an Error whose message is the main-process text verbatim', () => {
      replyValueLayerAdapterProxy();

      expect(() =>
        replyValueLayerAdapter({
          reply: {
            success: false,
            message: 'assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.',
          },
        }),
      ).toThrow(new Error('assayer: the run produced no result for src/happy-path/switch/pure-statement/pure-statement.ts.'));
    });
  });

  describe('replies that are not replies', () => {
    it('INVALID: {a payload that never went through the envelope} => throws', () => {
      replyValueLayerAdapterProxy();

      expect(() => replyValueLayerAdapter({ reply: { verdicts: [] } })).toThrow(/Invalid discriminator value/u);
    });

    it('EMPTY: {undefined} => throws', () => {
      replyValueLayerAdapterProxy();

      expect(() => replyValueLayerAdapter({ reply: undefined })).toThrow(/Required/u);
    });
  });
});
