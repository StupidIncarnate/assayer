import { anonymousReachContract } from './anonymous-reach-contract';
import { AnonymousReachStub } from './anonymous-reach.stub';

describe('anonymousReachContract', () => {
  describe('reached as a call argument', () => {
    it('VALID: {kind: "argument", receiver, method} => parses the iterated-receiver shape', () => {
      const result = anonymousReachContract.parse(AnonymousReachStub());

      expect(result).toStrictEqual({ kind: 'argument', receiver: 'items', method: 'map' });
    });

    it('VALID: {kind: "argument", callee} => parses a bare call passing the function', () => {
      const result = anonymousReachContract.parse({ kind: 'argument', callee: 'register' });

      expect(result).toStrictEqual({ kind: 'argument', callee: 'register' });
    });

    // A computed or chained callee names nothing the reader could match against the source, so the
    // reach carries no name rather than a guessed one.
    it('EMPTY: {kind: "argument"} with no names => parses, carrying only the position', () => {
      const result = anonymousReachContract.parse({ kind: 'argument' });

      expect(result).toStrictEqual({ kind: 'argument' });
    });
  });

  describe('reached without a call argument', () => {
    it('VALID: {kind: "return"} => parses the returned-closure shape', () => {
      const result = anonymousReachContract.parse({ kind: 'return' });

      expect(result).toStrictEqual({ kind: 'return' });
    });

    it('VALID: {kind: "invocation"} => parses the invoked-in-place shape', () => {
      const result = anonymousReachContract.parse({ kind: 'invocation' });

      expect(result).toStrictEqual({ kind: 'invocation' });
    });
  });

  describe('invalid reach', () => {
    it('INVALID: {kind: "callback"} => throws validation error', () => {
      expect(() => {
        return anonymousReachContract.parse({ kind: 'callback' });
      }).toThrow(/invalid_union_discriminator|Invalid discriminator/u);
    });
  });
});
