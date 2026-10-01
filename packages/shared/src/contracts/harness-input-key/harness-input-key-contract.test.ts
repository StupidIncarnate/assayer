import { harnessInputKeyContract } from './harness-input-key-contract';
import { HarnessInputKeyStub } from './harness-input-key.stub';

describe('harnessInputKeyContract', () => {
  describe('valid harness input keys', () => {
    it('VALID: {stub default} => carries the entry and the parameter it names', () => {
      const result = harnessInputKeyContract.parse(HarnessInputKeyStub());

      expect(result).toStrictEqual({ entry: 'audit', param: 'report' });
    });

    it('VALID: {entry "collect", param "sinks"} => carries the named pair', () => {
      const result = harnessInputKeyContract.parse(HarnessInputKeyStub({ entry: 'collect', param: 'sinks' }));

      expect(result).toStrictEqual({ entry: 'collect', param: 'sinks' });
    });

    // The value never rides here — a key alone is the cacheable half of a harness. Proves the
    // contract strips an accidental value rather than caching a callback that cannot serialize.
    it('VALID: {an extra value property} => strips it, since only the key is ever cached', () => {
      const result = harnessInputKeyContract.parse({ entry: 'audit', param: 'report', value: () => 'x' });

      expect(result).toStrictEqual({ entry: 'audit', param: 'report' });
    });
  });

  describe('invalid harness input keys', () => {
    it('INVALID: {no entry} => throws validation error', () => {
      expect(() => {
        return harnessInputKeyContract.parse({ param: 'report' });
      }).toThrow(/Invalid input: expected string, received undefined/u);
    });

    it('INVALID: {no param} => throws validation error', () => {
      expect(() => {
        return harnessInputKeyContract.parse({ entry: 'audit' });
      }).toThrow(/Invalid input: expected string, received undefined/u);
    });

    it('EMPTY: {empty entry} => throws validation error', () => {
      expect(() => {
        return harnessInputKeyContract.parse({ entry: '', param: 'report' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('EMPTY: {empty param} => throws validation error', () => {
      expect(() => {
        return harnessInputKeyContract.parse({ entry: 'audit', param: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });
  });
});
