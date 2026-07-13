import { symbolNameContract } from './symbol-name-contract';
import { SymbolNameStub } from './symbol-name.stub';

describe('symbolNameContract', () => {
  describe('valid symbol names', () => {
    it('VALID: {value: "formatGreeting"} => parses successfully', () => {
      const name = SymbolNameStub({ value: 'formatGreeting' });

      const result = symbolNameContract.parse(name);

      expect(result).toBe('formatGreeting');
    });
  });

  describe('invalid symbol names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return symbolNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
