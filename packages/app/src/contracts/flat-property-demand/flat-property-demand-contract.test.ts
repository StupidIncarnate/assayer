import { flatPropertyDemandContract } from './flat-property-demand-contract';
import { FlatPropertyDemandStub } from './flat-property-demand.stub';

describe('flatPropertyDemandContract', () => {
  describe('valid rows', () => {
    it('VALID: {a demanded leaf} => parses unchanged', () => {
      const result = flatPropertyDemandContract.parse({ name: 'db.retry', demand: { kind: 'demanded', values: [3, 7] } });

      expect(result).toStrictEqual({ name: 'db.retry', demand: { kind: 'demanded', values: [3, 7] } });
    });

    it('VALID: {an unknown leaf} => parses unchanged', () => {
      const result = flatPropertyDemandContract.parse({ name: 'retries', demand: { kind: 'unknown' } });

      expect(result).toStrictEqual({ name: 'retries', demand: { kind: 'unknown' } });
    });

    it('VALID: {stub default} => a demanded mode row', () => {
      expect(FlatPropertyDemandStub()).toStrictEqual({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } });
    });
  });

  describe('invalid rows', () => {
    it('INVALID: {a nested demand} => throws — nested must be flattened before reaching this contract', () => {
      expect(() => {
        return flatPropertyDemandContract.parse({ name: 'db', demand: { kind: 'nested', properties: [] } });
      }).toThrow(/Invalid/u);
    });
  });
});
