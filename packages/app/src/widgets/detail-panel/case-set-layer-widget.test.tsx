import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { CaseSetLayerWidget } from './case-set-layer-widget';
import { CaseSetLayerWidgetProxy } from './case-set-layer-widget.proxy';
import { EntrySignatureStub } from '@assayer/shared/contracts/entry-signature/entry-signature.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';

const DECIDE = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'decide',
    scopePath: ['*module*', 'decide'],
    params: [{ name: 'a', type: { kind: 'number' } }],
    access: { kind: 'named' },
  }),
  branches: [],
  exits: [{ coverageId: 'decide/return@top', kind: 'return', guardPath: [], line: 4 }],
  cases: [
    { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }] },
    { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 2 }], fewestRuns: false },
  ],
});

describe('CaseSetLayerWidget', () => {
  describe('the every-route set', () => {
    it('VALID: {set every-route, two cases} => labelled Every route with the count and one row per case', () => {
      CaseSetLayerWidgetProxy();

      const { getByTestId, getAllByTestId } = render(
        <CaseSetLayerWidget set="every-route" cases={DECIDE.cases} fn={DECIDE} driver="decide" entryLabel="decide" isModule={false} />,
        { wrapper: MantineProvider },
      );

      expect(getByTestId('CASE_SET_LABEL').textContent).toBe('Every route · 2');
      expect(getByTestId('CASE_SET').getAttribute('data-set')).toBe('every-route');
      expect(getAllByTestId('TEST_CASE_ROW').map((element) => element.textContent)).toStrictEqual([
        'not run decide(1)',
        'not run decide(2)',
      ]);
    });
  });

  describe('the fewest-runs set', () => {
    it('VALID: {set fewest-runs, one case} => labelled Fewest runs with the count and its rows under their own test ids', () => {
      CaseSetLayerWidgetProxy();

      const { getByTestId, getAllByTestId } = render(
        <CaseSetLayerWidget set="fewest-runs" cases={DECIDE.cases.filter((testCase) => testCase.fewestRuns)} fn={DECIDE} driver="decide" entryLabel="decide" isModule={false} />,
        { wrapper: MantineProvider },
      );

      expect(getByTestId('CASE_SET_LABEL').textContent).toBe('Fewest runs · 1');
      expect(getAllByTestId('FEWEST_RUNS_ROW').map((element) => element.textContent)).toStrictEqual(['not run decide(1)']);
    });
  });
});
