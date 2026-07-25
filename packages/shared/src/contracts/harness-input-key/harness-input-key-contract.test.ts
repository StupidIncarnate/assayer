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
  });

  describe('invalid harness input keys', () => {
    it('INVALID: {no param} => throws validation error', () => {
      expect(() => {
        return harnessInputKeyContract.parse({ entry: 'audit' });
      }).toThrow(/Required/u);
    });

    it('EMPTY: {empty entry} => throws validation error', () => {
      expect(() => {
        return harnessInputKeyContract.parse({ entry: '', param: 'report' });
      }).toThrow(/at least 1/u);
    });
  });
});
