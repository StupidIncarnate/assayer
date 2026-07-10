import { sourcePositionContract } from './source-position-contract';
import { SourcePositionStub } from './source-position.stub';

describe('sourcePositionContract', () => {
  describe('valid source positions', () => {
    it('VALID: {line: 3, column: 7} => parses with exact line and column', () => {
      const position = SourcePositionStub({ line: 3, column: 7 });

      const result = sourcePositionContract.parse(position);

      expect(result).toStrictEqual({ line: 3, column: 7 });
    });
  });

  describe('invalid source positions', () => {
    it('INVALID: {line: 0, column: 1} => throws validation error', () => {
      expect(() => {
        return sourcePositionContract.parse({ line: 0, column: 1 });
      }).toThrow(/./u);
    });

    it('INVALID: {line: 1, column: 0} => throws validation error', () => {
      expect(() => {
        return sourcePositionContract.parse({ line: 1, column: 0 });
      }).toThrow(/./u);
    });
  });
});
