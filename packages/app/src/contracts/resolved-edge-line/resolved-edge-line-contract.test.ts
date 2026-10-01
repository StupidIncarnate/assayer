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
      expect(() => resolvedEdgeLineContract.parse('')).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {a number} => throws', () => {
      expect(() => resolvedEdgeLineContract.parse(123)).toThrow(/expected string/iu);
    });
  });
});
