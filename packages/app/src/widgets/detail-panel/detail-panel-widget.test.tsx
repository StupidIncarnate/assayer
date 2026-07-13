import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { DetailPanelWidget } from './detail-panel-widget';
import { DetailPanelWidgetProxy } from './detail-panel-widget.proxy';
import { FileAnalysisStub, LineNumberStub } from '@assayer/shared/contracts';

describe('DetailPanelWidget', () => {
  describe('with a file analysis', () => {
    it('VALID: {analysis with one entry and case} => renders both tab labels and the tests-tab case row', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub();

      const { getByTestId, getAllByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} />,
      });

      expect(getByTestId('TAB_ENRICHMENT').textContent).toBe('Enrichment');
      expect(getByTestId('TAB_TESTS').textContent).toBe('Tests');

      const caseRows = getAllByTestId('TEST_CASE_ROW').map((element) => element.textContent);

      expect(caseRows).toStrictEqual(['formatGreeting("") → reaches L3']);
    });
  });

  describe('hovered-line highlighting', () => {
    it('VALID: {hoveredLine: 3} => marks the case reaching that line as matched', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} hoveredLine={LineNumberStub({ value: 3 })} />,
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('true');
    });

    it('VALID: {hoveredLine: 2} => marks the case whose guard branch is on that line as matched', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} hoveredLine={LineNumberStub({ value: 2 })} />,
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('true');
    });

    it('VALID: {hoveredLine: 9} => marks a case not on that line as unmatched', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} hoveredLine={LineNumberStub({ value: 9 })} />,
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('false');
    });
  });

  describe('with no analysis', () => {
    it('EMPTY: {analysis: undefined} => renders the empty tests prompt', () => {
      DetailPanelWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={undefined} /> });

      expect(getByTestId('TESTS_EMPTY').textContent).toBe('No entries in this file');
    });
  });
});
