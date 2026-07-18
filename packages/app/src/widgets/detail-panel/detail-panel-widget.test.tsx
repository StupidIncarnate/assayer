import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { DetailPanelWidget } from './detail-panel-widget';
import { DetailPanelWidgetProxy } from './detail-panel-widget.proxy';
import {
  CaseResultStub,
  DarkSpotStub,
  EntrySignatureStub,
  FileAnalysisStub,
  FunctionAnalysisStub,
  LineNumberStub,
  LintEntryStub,
  RunResultStub,
  UndrivenEntryStub,
} from '@assayer/shared/contracts';

// The real module-scope shape: nothing can call it, and it takes no params — which is why its derived
// cases all arrange nothing and each claims a different exit from identical setup.
const MODULE_ENTRY = EntrySignatureStub({
  name: '*module*',
  scopePath: ['*module*'],
  params: [],
  access: { kind: 'unreachable' },
});

const LOOP_DARK_SPOT = DarkSpotStub({
  kind: 'ForOfStatement',
  scopePath: ['*module*', 'sumAll'],
  startLine: 4,
  endLine: 6,
});

const LOOP_DARK_SPOT_TEXT =
  'DARK ForOfStatement at L4-L6 in *module*/sumAll — Assayer has no handler for it, so nothing inside it is covered';

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
            testCase: { reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }] },
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
            testCase: { reachesExit: 'formatGreeting/return@if-then', arrange: [{ kind: 'param', param: 'name', value: '' }] },
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

  describe('dark spots', () => {
    // Read from the ANALYSIS, so merely opening the file states it. Gated behind a run, a file nobody
    // ran would read as understood — and this file's cases all PASS, so nothing else contradicts it.
    it('VALID: {analysis with a dark spot, no run} => the dark spot is stated with the CLI wording', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ darkSpots: [LOOP_DARK_SPOT] });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(getByTestId('DARK_SPOT').textContent).toBe(LOOP_DARK_SPOT_TEXT);
    });

    // A file whose only logic Assayer cannot parse has no entries to hang the admission off. Gated
    // behind the entries branch, the panel would answer "No entries in this file" and nothing else —
    // indistinguishable from a file with genuinely nothing in it.
    it('EDGE: {a dark spot but no entries} => the dark spot is stated beside the empty prompt', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ functions: [], enrichment: [], darkSpots: [LOOP_DARK_SPOT] });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(getByTestId('DARK_SPOT').textContent).toBe(LOOP_DARK_SPOT_TEXT);
      expect(getByTestId('TESTS_EMPTY').textContent).toBe('No entries in this file');
    });

    // The two admissions answer "who owes this work?" with different answers, so they render as
    // different rows with different words. Merged, the panel would tell a reader to write a harness
    // for a for-loop no harness can reach.
    it('VALID: {a gap and a dark spot together} => each keeps its own row and its own wording', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ darkSpots: [LOOP_DARK_SPOT] });
      const run = RunResultStub({ gaps: [{ name: 'find', reason: 'needs a harness' }] });

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} run={run} />,
      });

      expect(getByTestId('RUN_GAP').textContent).toBe('GAP find — needs a harness');
      expect(getByTestId('DARK_SPOT').textContent).toBe(LOOP_DARK_SPOT_TEXT);
    });

    it('VALID: {two dark spots} => each is stated on its own row', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({
        darkSpots: [LOOP_DARK_SPOT, DarkSpotStub({ kind: 'TryStatement', scopePath: ['load'], startLine: 9, endLine: 12 })],
      });

      const { getAllByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(getAllByTestId('DARK_SPOT').map((element) => element.textContent)).toStrictEqual([
        LOOP_DARK_SPOT_TEXT,
        'DARK TryStatement at L9-L12 in load — Assayer has no handler for it, so nothing inside it is covered',
      ]);
    });

    it('EMPTY: {analysis with no dark spots} => no dark-spot row is rendered', () => {
      DetailPanelWidgetProxy();

      const { queryAllByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} />,
      });

      expect(queryAllByTestId('DARK_SPOT')).toStrictEqual([]);
    });
  });

  describe('undriven entries', () => {
    // Read from the ANALYSIS, so opening the file states it — no run required.
    it('VALID: {analysis with an undriven entry, no run} => it is stated with the CLI wording', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ undriven: [UndrivenEntryStub({ name: 'inner', reason: 'it is not exported' })] });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(getByTestId('UNDRIVEN').textContent).toBe('UNDRIVEN inner — it is not exported');
    });

    // The pure-statement shape. The entry's two derived cases arrange NOTHING and each claims a
    // different exit, so at most one could ever hold — and the run drives neither, reporting 0/0.
    // Listing them would promise tests that cannot exist.
    it('VALID: {an undriven entry with derived cases} => its cases are not listed as tests', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({
        functions: [FunctionAnalysisStub({ entry: MODULE_ENTRY })],
        undriven: [UndrivenEntryStub({ name: '*module*' })],
      });

      const { queryAllByTestId, getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} />,
      });

      expect(queryAllByTestId('TEST_CASE_ROW')).toStrictEqual([]);
      expect(queryAllByTestId('TEST_ENTRY')).toStrictEqual([]);
      expect(getByTestId('UNDRIVEN').textContent).toBe(
        'UNDRIVEN *module* — it runs at import time, so no case drove its branches',
      );
    });

    // A file whose only entry is undriven is NOT an empty file, and must never read like one.
    it('EDGE: {the only entry is undriven} => the admission replaces the empty prompt', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({
        functions: [FunctionAnalysisStub({ entry: MODULE_ENTRY })],
        undriven: [UndrivenEntryStub({ name: '*module*' })],
      });

      const { queryAllByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(queryAllByTestId('TESTS_EMPTY')).toStrictEqual([]);
    });

    // Nothing to drive means nothing to hover and nothing a run would add — the verdict is already
    // stated in full above.
    it('EDGE: {no driven entries} => neither the hover hint nor Run is offered', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({
        functions: [FunctionAnalysisStub({ entry: MODULE_ENTRY })],
        undriven: [UndrivenEntryStub({ name: '*module*' })],
      });

      const { queryAllByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(queryAllByTestId('RUN_BUTTON')).toStrictEqual([]);
      expect(queryAllByTestId('TESTS_HINT')).toStrictEqual([]);
    });

    // The nested-function shape: a live entry keeps its cases and its Run while the private helper
    // beside it is admitted as undriven.
    it('VALID: {a driven entry beside an undriven one} => the driven cases and Run survive', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ undriven: [UndrivenEntryStub({ name: 'inner', reason: 'it is not exported' })] });

      const { getByTestId, getAllByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} />,
      });

      expect(getAllByTestId('TEST_CASE_ROW').map((element) => element.textContent)).toStrictEqual([
        'not run formatGreeting("") → reaches L3',
      ]);
      expect(getByTestId('RUN_BUTTON').textContent).toBe('Run');
      expect(getByTestId('UNDRIVEN').textContent).toBe('UNDRIVEN inner — it is not exported');
    });

    // Three admissions, three answers to "who owes this work?", three rows. Merged, each would order
    // the reader to do something nobody can do.
    it('VALID: {a gap, a dark spot and an undriven entry} => each keeps its own row and wording', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({
        darkSpots: [LOOP_DARK_SPOT],
        undriven: [UndrivenEntryStub({ name: 'inner', reason: 'it is not exported' })],
      });
      const run = RunResultStub({ gaps: [{ name: 'find', reason: 'needs a harness' }] });

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={analysis} run={run} />,
      });

      expect(getByTestId('RUN_GAP').textContent).toBe('GAP find — needs a harness');
      expect(getByTestId('DARK_SPOT').textContent).toBe(LOOP_DARK_SPOT_TEXT);
      expect(getByTestId('UNDRIVEN').textContent).toBe('UNDRIVEN inner — it is not exported');
    });

    it('EMPTY: {analysis with nothing undriven} => no undriven row is rendered', () => {
      DetailPanelWidgetProxy();

      const { queryAllByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} />,
      });

      expect(queryAllByTestId('UNDRIVEN')).toStrictEqual([]);
    });
  });

  describe('dead-surface lints', () => {
    // Read from the ANALYSIS like the other admissions, and worded exactly as `assayer unit` prints
    // it — but it is the repo's debt, so it is the one row that can fail a build.
    it('VALID: {analysis with a dead-surface lint} => it is stated with the CLI wording', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ lints: [LintEntryStub({ name: 'unused', message: 'nothing calls it' })] });

      const { getByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(getByTestId('LINT').textContent).toBe('LINT unused — nothing calls it');
    });

    // A file whose only content is a dead private is NOT empty: the lint is the tab's content, so the
    // empty prompt must never appear beside it.
    it('EDGE: {the only content is a lint} => the lint replaces the empty prompt', () => {
      DetailPanelWidgetProxy();
      const analysis = FileAnalysisStub({ functions: [], lints: [LintEntryStub()] });

      const { queryAllByTestId, getByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={analysis} /> });

      expect(queryAllByTestId('TESTS_EMPTY')).toStrictEqual([]);
      expect(getByTestId('LINT').textContent).toBe('LINT decide — nothing in this file calls it, so it is dead surface');
    });

    it('EMPTY: {analysis with no lints} => no lint row is rendered', () => {
      DetailPanelWidgetProxy();

      const { queryAllByTestId } = testingLibraryRenderAdapter({ ui: <DetailPanelWidget analysis={FileAnalysisStub()} /> });

      expect(queryAllByTestId('LINT')).toStrictEqual([]);
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
    // which. This panel is the only surface that prints the reason.
    it('ERROR: {a run that could not happen} => the reason is shown', () => {
      DetailPanelWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={FileAnalysisStub()} runError={new Error('the CLI is not built')} />,
      });

      expect(getByTestId('RUN_ERROR').textContent).toBe('the CLI is not built');
    });

    // A run error is about the RUN, not about what the file declares. Were it gated on there being
    // entries, a file with nothing to drive would fail to run and say nothing anywhere.
    it('ERROR: {a run that could not happen, no entries} => the reason is still shown', () => {
      DetailPanelWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: <DetailPanelWidget analysis={undefined} runError={new Error('the CLI is not built')} />,
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
