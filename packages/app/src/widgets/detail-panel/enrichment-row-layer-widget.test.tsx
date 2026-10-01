import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { EnrichmentRowLayerWidget } from './enrichment-row-layer-widget';
import { EnrichmentRowLayerWidgetProxy } from './enrichment-row-layer-widget.proxy';
import { FileAnalysisStub } from '@assayer/shared/contracts/file-analysis/file-analysis.stub';

describe('EnrichmentRowLayerWidget', () => {
  describe('row text', () => {
    it('VALID: {a row with no range} => renders the line, symbol and type with no range suffix', () => {
      EnrichmentRowLayerWidgetProxy();
      const { enrichment } = FileAnalysisStub({ enrichment: [{ line: 2, symbol: 'name', typeText: 'string' }] });

      const { getByTestId } = render((
          <>
            {enrichment.map((row) => (
              <EnrichmentRowLayerWidget key={row.symbol} row={row} />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('ENRICHMENT_ROW').textContent).toBe('L2  name: string');
    });

    it('VALID: {a row with range [0, 1]} => appends the braced value range', () => {
      EnrichmentRowLayerWidgetProxy();
      const { enrichment } = FileAnalysisStub({ enrichment: [{ line: 2, symbol: 'x', typeText: 'number', range: [0, 1] }] });

      const { getByTestId } = render((
          <>
            {enrichment.map((row) => (
              <EnrichmentRowLayerWidget key={row.symbol} row={row} />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('ENRICHMENT_ROW').textContent).toBe('L2  x: number  → { 0, 1 }');
    });
  });

  describe('hover state', () => {
    it('VALID: {hoveredLine equal to the row line} => data-match is true', () => {
      EnrichmentRowLayerWidgetProxy();
      const { enrichment } = FileAnalysisStub({ enrichment: [{ line: 2, symbol: 'name', typeText: 'string' }] });

      const { getByTestId } = render((
          <>
            {enrichment.map((row) => (
              <EnrichmentRowLayerWidget key={row.symbol} row={row} hoveredLine={2} />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('ENRICHMENT_ROW').getAttribute('data-match')).toBe('true');
    });

    it('VALID: {hoveredLine on another line} => data-match is false', () => {
      EnrichmentRowLayerWidgetProxy();
      const { enrichment } = FileAnalysisStub({ enrichment: [{ line: 2, symbol: 'name', typeText: 'string' }] });

      const { getByTestId } = render((
          <>
            {enrichment.map((row) => (
              <EnrichmentRowLayerWidget key={row.symbol} row={row} hoveredLine={9} />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('ENRICHMENT_ROW').getAttribute('data-match')).toBe('false');
    });

    it('EMPTY: {no hoveredLine} => data-match is false', () => {
      EnrichmentRowLayerWidgetProxy();
      const { enrichment } = FileAnalysisStub({ enrichment: [{ line: 2, symbol: 'name', typeText: 'string' }] });

      const { getByTestId } = render((
          <>
            {enrichment.map((row) => (
              <EnrichmentRowLayerWidget key={row.symbol} row={row} hoveredLine={null} />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('ENRICHMENT_ROW').getAttribute('data-match')).toBe('false');
    });
  });
});
