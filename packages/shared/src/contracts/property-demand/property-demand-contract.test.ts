import { propertyDemandContract } from './property-demand-contract';
import { PropertyDemandStub } from './property-demand.stub';

describe('propertyDemandContract', () => {
  describe('valid property demands', () => {
    it('VALID: {stub default} => a demanded property with its branched values', () => {
      const result = propertyDemandContract.parse(PropertyDemandStub());

      expect(result).toStrictEqual({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } });
    });

    it('VALID: {an unread property} => an unknown demand carrying no values', () => {
      const result = propertyDemandContract.parse(
        PropertyDemandStub({ name: 'retries', demand: { kind: 'unknown' } }),
      );

      expect(result).toStrictEqual({ name: 'retries', demand: { kind: 'unknown' } });
    });
  });

  describe('invalid property demands', () => {
    it('INVALID: {unknown demand kind} => throws validation error', () => {
      expect(() => {
        return propertyDemandContract.parse({ name: 'mode', demand: { kind: 'guessed', values: [] } });
      }).toThrow(/Invalid/u);
    });
  });
});
