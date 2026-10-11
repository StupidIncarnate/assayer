import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { TestCaseLayerWidget } from './test-case-layer-widget';
import { TestCaseLayerWidgetProxy } from './test-case-layer-widget.proxy';
import { CaseResultStub } from '@assayer/shared/contracts/case-result/case-result.stub';
import { EntrySignatureStub } from '@assayer/shared/contracts/entry-signature/entry-signature.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';
import { RunResultStub } from '@assayer/shared/contracts/run-result/run-result.stub';

const DECIDE = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'decide',
    scopePath: ['*module*', 'decide'],
    params: [{ name: 'a', type: { kind: 'number' } }],
    access: { kind: 'named' },
  }),
  branches: [],
  exits: [{ coverageId: 'decide/return@top', kind: 'return', guardPath: [], line: 4 }],
  cases: [{ reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }], arms: [], driven: true, fewestRuns: true }],
});

const UNDRIVEN_OUT_OF_SET = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'decide',
    scopePath: ['*module*', 'decide'],
    params: [{ name: 'a', type: { kind: 'number' } }],
    access: { kind: 'named' },
  }),
  branches: [{ coverageId: 'decide/if:a', kind: 'if', condition: { kind: 'leaf', id: 'decide/if:a#leaf.0', operandParamName: 'a', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 0 } }, startLine: 2, endLine: 3 }],
  exits: [{ coverageId: 'decide/return@top', kind: 'return', guardPath: [], line: 4 }],
  cases: [
    {
      reachesPath: ['decide/return@top'],
      arrange: [{ kind: 'param', param: 'a', value: 1 }],
      arms: [{ branchCoverageId: 'decide/if:a', arm: 'then' }],
      driven: false,
      fewestRuns: false,
    },
  ],
});

describe('TestCaseLayerWidget', () => {
  describe('an unrun case', () => {
    it('VALID: {driven fewest-runs case, no run} => the row reads not run, names the driver and the exit line, and is a running row with no undriven marker', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId, queryByTestId } = render((
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
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run decide(1)');
      expect(getByTestId('CASE_RETURN').textContent).toBe('  => 4: (not run)');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('not-run');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-running')).toBe('true');
      expect(queryByTestId('CASE_UNDRIVEN')).toBe(null);
    });

    it('VALID: {module entry} => the row names the entry label with no call parens', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = render((
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
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run message');
      expect(getByTestId('CASE_RETURN').textContent).toBe('  => 4: (not run)');
    });
  });

  describe('hover and run set', () => {
    it('VALID: {hoveredLine 4, the exit line} => data-match is true', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = render((
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                hoveredLine={4}
              />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('true');
    });

    it('VALID: {hoveredLine 9, another line} => data-match is false', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = render((
          <>
            {DECIDE.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={DECIDE}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                hoveredLine={9}
              />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('false');
    });

    it('VALID: {undriven case outside the fewest-runs set} => the row is not running, carries the undriven marker and its arms, and reads not run', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = render((
          <>
            {UNDRIVEN_OUT_OF_SET.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={UNDRIVEN_OUT_OF_SET}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
              />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-running')).toBe('false');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-driven')).toBe('false');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('not-run');
      expect(getByTestId('CASE_UNDRIVEN').textContent).toBe('undriven');
      expect(getByTestId('CASE_ARMS').textContent).toBe('L2 then');
    });

    it('VALID: {a hovered branch line on the case arms} => the arm branch line counts as touched', () => {
      TestCaseLayerWidgetProxy();

      const { getByTestId } = render((
          <>
            {UNDRIVEN_OUT_OF_SET.cases.map((testCase) => (
              <TestCaseLayerWidget
                key={testCase.reachesPath.join('>')}
                fn={UNDRIVEN_OUT_OF_SET}
                testCase={testCase}
                driver="decide"
                entryLabel="decide"
                isModule={false}
                hoveredLine={2}
              />
            ))}
          </>
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-match')).toBe('true');
    });
  });

  describe('a settled run', () => {
    it('VALID: {errored result with a message} => the row names the driver and outcome line carries the runner message', () => {
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

      const { getByTestId } = render((
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
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('ERROR decide(1)');
      expect(getByTestId('CASE_RETURN').textContent).toBe('  => 4: (not run)');
      expect(getByTestId('CASE_OUTCOME').textContent).toBe('threw before reaching an exit: items.map is not a function');
    });

    it('VALID: {passed result with exit trace} => the row shows the exit value on line 2', () => {
      TestCaseLayerWidgetProxy();
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'passed',
            testCase: { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }] },
            trace: [{ id: 'decide/return@top', kind: 'exit', valueText: '10' }],
          }),
        ],
      });

      const { getByTestId, queryByTestId } = render((
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
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('PASS decide(1)');
      expect(getByTestId('CASE_RETURN').textContent).toBe('  => 4: 10');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('passed');
      expect(queryByTestId('CASE_OUTCOME')).toBe(null);
    });

    it('VALID: {passed result without exit trace} => falls back to (not run) return value', () => {
      TestCaseLayerWidgetProxy();
      const run = RunResultStub({
        cases: [
          CaseResultStub({
            status: 'passed',
            testCase: { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }] },
          }),
        ],
      });

      const { getByTestId, queryByTestId } = render((
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
        ), { wrapper: MantineProvider });

      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('PASS decide(1)');
      expect(getByTestId('CASE_RETURN').textContent).toBe('  => 4: (not run)');
      expect(getByTestId('TEST_CASE_ROW').getAttribute('data-status')).toBe('passed');
      expect(queryByTestId('CASE_OUTCOME')).toBe(null);
    });
  });
});
