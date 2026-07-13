import { lineEnrichmentContract } from './line-enrichment-contract';
import { LineEnrichmentStub } from './line-enrichment.stub';

describe('lineEnrichmentContract', () => {
  describe('valid line enrichments', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const enrichment = LineEnrichmentStub();

      const result = lineEnrichmentContract.parse(enrichment);

      expect(result).toStrictEqual(enrichment);
    });

    it('VALID: {range} => parses with a representative range', () => {
      const enrichment = LineEnrichmentStub({ line: 2, symbol: 'name.length', typeText: 'number', range: ['', 'a'] });

      const result = lineEnrichmentContract.parse(enrichment);

      expect(result).toStrictEqual(enrichment);
    });
  });

  describe('invalid line enrichments', () => {
    it('INVALID: {line: 0} => throws validation error', () => {
      expect(() => {
        return lineEnrichmentContract.parse({ line: 0, symbol: 'name', typeText: 'string' });
      }).toThrow(/greater than 0/u);
    });
  });
});
