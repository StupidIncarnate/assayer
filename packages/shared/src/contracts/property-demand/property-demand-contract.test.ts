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

    it('VALID: {a nested property} => the sub-object\'s own demands, one level down', () => {
      const result = propertyDemandContract.parse(
        PropertyDemandStub({
          name: 'db',
          demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] },
        }),
      );

      expect(result).toStrictEqual({
        name: 'db',
        demand: { kind: 'nested', properties: [{ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } }] },
      });
    });

    it('VALID: {a nested property whose own child is itself nested} => the demand tree walks arbitrarily deep', () => {
      const result = propertyDemandContract.parse(
        PropertyDemandStub({
          name: 'db',
          demand: {
            kind: 'nested',
            properties: [
              {
                name: 'retry',
                demand: { kind: 'nested', properties: [{ name: 'backoff', demand: { kind: 'demanded', values: ['x'] } }] },
              },
            ],
          },
        }),
      );

      expect(result).toStrictEqual({
        name: 'db',
        demand: {
          kind: 'nested',
          properties: [
            {
              name: 'retry',
              demand: { kind: 'nested', properties: [{ name: 'backoff', demand: { kind: 'demanded', values: ['x'] } }] },
            },
          ],
        },
      });
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
