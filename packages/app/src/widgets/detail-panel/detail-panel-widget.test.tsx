import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { DetailPanelWidget } from './detail-panel-widget';
import { DetailPanelWidgetProxy } from './detail-panel-widget.proxy';
import { FileAnalysisStub, LineNumberStub, RunResultStub, CaseResultStub } from '@assayer/shared/contracts';

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

      expect(caseRows).toStrictEqual(['not run formatGreeting("") → reaches L3']);
    });

    // A case with no result must never render like one that passed — "not run" is stated, not
    // implied by the absence of a marker.
    it('EMPTY: {no run} => every case reads not-run rather than blank', () => {
      DetailPanelWidgetProxy();

      const { getAllByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} />,
      });

      expect(getAllByTestId('TEST_CASE_ROW').map((element) => element.getAttribute('data-status'))).toStrictEqual([
        'not-run',
      ]);
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

  describe('with a saved run', () => {
    it('VALID: {a passing run for the derived case} => the case reads its verdict', () => {
      DetailPanelWidgetProxy();
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'passed',
            testCase: { reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] },
          }),
        ],
      });

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} run={run} />,
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('passed');
    });

    it('VALID: {a failing run for the derived case} => the case reads failed', () => {
      DetailPanelWidgetProxy();
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'failed',
            testCase: { reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] },
          }),
        ],
      });

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} run={run} />,
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('failed');
    });

    // A gap is Assayer saying what it could NOT drive. Shown even when everything passed, or the
    // panel reads as complete coverage of the file.
    it('VALID: {a run with a gap} => the gap is shown with its reason', () => {
      DetailPanelWidgetProxy();
      const run = RunResultStub({ gaps: [{ name: 'find', reason: 'needs a harness' }] });

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} run={run} />,
      });

      expect(getByTestId('RUN_GAP').textContent).toBe('GAP find — needs a harness');
    });
  });

  describe('running', () => {
    it('VALID: {a Run click} => calls onRun', () => {
      DetailPanelWidgetProxy();
      let ran = false;

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <DetailPanelWidget
            analysis={FileAnalysisStub()}
            onRun={() => {
              ran = true;
            }}
          />
        ),
      });
      getByTestId('RUN_BUTTON').click();

      expect(ran).toBe(true);
    });

    // The run could not HAPPEN — a different thing from a failing case, and the reader needs to know
    // which.
    it('ERROR: {a run that could not happen} => the reason is shown', () => {
      DetailPanelWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} runError={new Error('the CLI is not built')} />,
      });

      expect(getByTestId('RUN_ERROR').textContent).toBe('the CLI is not built');
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
