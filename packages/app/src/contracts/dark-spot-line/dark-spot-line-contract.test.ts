import { darkSpotLineContract } from './dark-spot-line-contract';
import { DarkSpotLineStub } from './dark-spot-line.stub';

describe('darkSpotLineContract', () => {
  describe('dark spot text', () => {
    it('VALID: {stub default} => the sentence both surfaces show', () => {
      expect(String(DarkSpotLineStub())).toBe(
        'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it is covered',
      );
    });
  });

  describe('invalid input', () => {
    // A dark spot that renders as nothing is the silence the channel exists to break.
    it('EMPTY: {""} => throws rather than rendering a blank admission', () => {
      expect(() => darkSpotLineContract.parse('')).toThrow(/at least 1/iu);
    });

    it('INVALID: {a number} => throws', () => {
      expect(() => darkSpotLineContract.parse(123 as never)).toThrow(/expected string/iu);
    });
  });
});
