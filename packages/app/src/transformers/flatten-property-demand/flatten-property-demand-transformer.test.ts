import { PropertyDemandStub } from '@assayer/shared/contracts/property-demand/property-demand.stub';

import { flattenPropertyDemandTransformer } from './flatten-property-demand-transformer';

describe('flattenPropertyDemandTransformer', () => {
  describe('a flat property list, nothing nested', () => {
    it('VALID: {mode demanded, retries unknown} => one row per property, unchanged', () => {
      const result = flattenPropertyDemandTransformer({
        properties: [
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } }),
          PropertyDemandStub({ name: 'retries', demand: { kind: 'unknown' } }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'mode', demand: { kind: 'demanded', values: ['a', 'abc123'] } },
        { name: 'retries', demand: { kind: 'unknown' } },
      ]);
    });
  });

  describe('a nested demand', () => {
    it("VALID: {db nested over retry} => ONE row named 'db.retry', the nested wrapper gone", () => {
      const result = flattenPropertyDemandTransformer({
        properties: [
          PropertyDemandStub({
            name: 'db',
            demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'demanded', values: [3, 7] } })] },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'db.retry', demand: { kind: 'demanded', values: [3, 7] } }]);
    });

    it("VALID: {a three-level nest} => the row's name carries the FULL dotted path", () => {
      const result = flattenPropertyDemandTransformer({
        properties: [
          PropertyDemandStub({
            name: 'db',
            demand: {
              kind: 'nested',
              properties: [
                PropertyDemandStub({
                  name: 'retry',
                  demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'backoff', demand: { kind: 'demanded', values: ['x'] } })] },
                }),
              ],
            },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'db.retry.backoff', demand: { kind: 'demanded', values: ['x'] } }]);
    });

    it('VALID: {a nested property with an UNKNOWN leaf} => the row carries unknown, never an invented demand', () => {
      const result = flattenPropertyDemandTransformer({
        properties: [
          PropertyDemandStub({
            name: 'db',
            demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'unknown' } })] },
          }),
        ],
      });

      expect(result).toStrictEqual([{ name: 'db.retry', demand: { kind: 'unknown' } }]);
    });

    it('VALID: {a nested property beside a flat sibling} => both rows present, sibling untouched', () => {
      const result = flattenPropertyDemandTransformer({
        properties: [
          PropertyDemandStub({
            name: 'db',
            demand: { kind: 'nested', properties: [PropertyDemandStub({ name: 'retry', demand: { kind: 'demanded', values: [3] } })] },
          }),
          PropertyDemandStub({ name: 'mode', demand: { kind: 'demanded', values: ['a'] } }),
        ],
      });

      expect(result).toStrictEqual([
        { name: 'db.retry', demand: { kind: 'demanded', values: [3] } },
        { name: 'mode', demand: { kind: 'demanded', values: ['a'] } },
      ]);
    });
  });

  describe('an empty property list', () => {
    it('EMPTY: {no properties} => no rows', () => {
      expect(flattenPropertyDemandTransformer({ properties: [] })).toStrictEqual([]);
    });
  });
});
