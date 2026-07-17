import { undrivenLineContract } from './undriven-line-contract';
import { UndrivenLineStub } from './undriven-line.stub';

describe('undrivenLineContract', () => {
  describe('undriven text', () => {
    it('VALID: {stub default} => the sentence the panel shows', () => {
      expect(String(UndrivenLineStub())).toBe(
        'UNDRIVEN inner — it is not exported, so nothing outside the module can call it',
      );
    });
  });

  describe('invalid input', () => {
    // An admission that renders as nothing is the silence the channel exists to break.
    it('EMPTY: {""} => throws rather than rendering a blank admission', () => {
      expect(() => undrivenLineContract.parse('')).toThrow(/at least 1/iu);
    });

    it('INVALID: {a number} => throws', () => {
      expect(() => undrivenLineContract.parse(123 as never)).toThrow(/expected string/iu);
    });
  });
});
