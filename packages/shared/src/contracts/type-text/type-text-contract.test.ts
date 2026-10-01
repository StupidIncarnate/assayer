import { typeTextContract } from './type-text-contract';
import { TypeTextStub } from './type-text.stub';

describe('typeTextContract', () => {
  describe('valid type text', () => {
    it('VALID: {value: "void"} => parses successfully', () => {
      const text = TypeTextStub({ value: 'void' });

      const result = typeTextContract.parse(text);

      expect(result).toBe('void');
    });
  });

  describe('invalid type text', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return typeTextContract.parse('');
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
