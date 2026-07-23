import { stubKeyContract } from './stub-key-contract';
import { StubKeyStub } from './stub-key.stub';

describe('stubKeyContract', () => {
  describe('valid stub keys', () => {
    it('VALID: {an object key "<relPath>#<Type>"} => parses the branded identity', () => {
      const result = stubKeyContract.parse(StubKeyStub());

      expect(result).toBe('src/config/config.ts#Config');
    });

    it('VALID: {an env key "process.env#MODE"} => parses the branded identity', () => {
      const result = stubKeyContract.parse(StubKeyStub({ value: 'process.env#MODE' }));

      expect(result).toBe('process.env#MODE');
    });
  });

  describe('invalid stub keys', () => {
    it('EMPTY: {empty string} => throws validation error', () => {
      expect(() => {
        return stubKeyContract.parse('');
      }).toThrow(/at least 1/u);
    });
  });
});
