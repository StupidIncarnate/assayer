import { resolvedEdgeLineContract } from './resolved-edge-line-contract';
import { ResolvedEdgeLineStub } from './resolved-edge-line.stub';

describe('resolvedEdgeLineContract', () => {
  describe('inspector cell text', () => {
    it('VALID: {stub default} => one inspector cell line', () => {
      expect(String(ResolvedEdgeLineStub())).toBe('name: string');
    });
  });

  describe('invalid input', () => {
    it('EMPTY: {""} => throws rather than rendering a blank cell', () => {
      expect(() => resolvedEdgeLineContract.parse('')).toThrow(/at least 1/iu);
    });

    it('INVALID: {a number} => throws', () => {
      expect(() => resolvedEdgeLineContract.parse(123 as never)).toThrow(/expected string/iu);
    });
  });
});
