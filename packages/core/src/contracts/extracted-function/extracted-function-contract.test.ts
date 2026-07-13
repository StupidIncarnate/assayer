import { extractedFunctionContract } from './extracted-function-contract';
import { ExtractedFunctionStub } from './extracted-function.stub';

describe('extractedFunctionContract', () => {
  describe('valid extracted functions', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const extracted = ExtractedFunctionStub();

      const result = extractedFunctionContract.parse(extracted);

      expect(result).toStrictEqual(extracted);
    });
  });

  describe('invalid extracted functions', () => {
    it('INVALID: {} => throws validation error for the missing entry', () => {
      expect(() => {
        return extractedFunctionContract.parse({ branches: [], exits: [] });
      }).toThrow(/Required/u);
    });
  });
});
