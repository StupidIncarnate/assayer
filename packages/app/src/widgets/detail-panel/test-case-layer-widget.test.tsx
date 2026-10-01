import { testingLibraryRenderAdapter } from '../../adapters/testing-library/render/testing-library-render-adapter';
import { TestCaseLayerWidget } from './test-case-layer-widget';
import { TestCaseLayerWidgetProxy } from './test-case-layer-widget.proxy';
import { StatusViewStub } from '../../contracts/status-view/status-view.stub';
import {
  CaseResultStub,
  EntrySignatureStub,
  FunctionAnalysisStub,
  LineNumberStub,
  RunResultStub,
} from '@assayer/shared/contracts';

const DECIDE = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'decide',
    scopePath: ['*module*', 'decide'],
    params: [{ name: 'a', type: { kind: 'number' } }],
    access: { kind: 'named' },
  }),
  branches: [],
  exits: [{ coverageId: 'decide/return@top', kind: 'return', guardPath: [], line: 4 }],
  cases: [{ reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }], salient: true }],
});

const BREADTH = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'decide',
    scopePath: ['*module*', 'decide'],
    params: [{ name: 'a', type: { kind: 'number' } }],
    access: { kind: 'named' },
  }),
  branches: [],
  exits: [{ coverageId: 'decide/return@top', kind: 'return', guardPath: [], line: 4 }],
  cases: [{ reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }], salient: false }],
});

describe('TestCaseLayerWidget', () => {
  describe('an unrun case', () => {
    it('VALID: {salient case, no run} => the row reads not run, names the driver and the exit line, and carries the badge', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run decide(1) → reaches L4');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('not-run');
      expect(getByTestId('INTELLIGENT_BADGE').textContent).toBe('INTELLIGENT');
      expect(queryByTestId('CASE_OUTCOME')).toBe(null);
    });

    it('VALID: {module entry} => the row names the entry label with no call parens', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="message"
                isModule
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run message → reaches L4');
    });
  });

  describe('hover and run mode', () => {
    it('VALID: {hoveredLine 4, the exit line} => data-match is true', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                hoveredLine={LineNumberStub({ value: 4 })}
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('true');
    });

    it('VALID: {hoveredLine 9, another line} => data-match is false', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                hoveredLine={LineNumberStub({ value: 9 })}
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('false');
    });

    it('VALID: {runMode intelligent, non-salient case} => the row is grayed and shows no badge', () => {
      TestCaseLayerWidgetProxy();
      const { runMode } = StatusViewStub({ runMode: 'intelligent' });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {BREADTH.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={BREADTH}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                runMode={runMode}
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-running')).toBe('false');
      expect(queryByTestId('INTELLIGENT_BADGE')).toBe(null);
    });
  });

  describe('a settled run', () => {
    it('VALID: {errored result with a message} => the row reads predicted and the outcome line carries the runner message', () => {
      TestCaseLayerWidgetProxy();
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'errored',
            observedPath: [],
            message: 'threw before reaching an exit: items.map is not a function',
            testCase: { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }] },
          }),
        ],
      });

      const { getByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                run={run}
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('ERROR decide(1) → predicted L4');
      expect(getByTestId('CASE_OUTCOME').textContent).toBe('threw before reaching an exit: items.map is not a function');
    });

    it('VALID: {passed result} => the row reads reaches and shows no outcome line', () => {
      TestCaseLayerWidgetProxy();
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'passed',
            testCase: { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }] },
          }),
        ],
      });

      const { getByTestId, queryByTestId } = testingLibraryRenderAdapter({
        ui: (
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                run={run}
              />
            ))}
          </>
        ),
      });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('passed');
      expect(queryByTestId('CASE_OUTCOME')).toBe(null);
    });
  });
});
