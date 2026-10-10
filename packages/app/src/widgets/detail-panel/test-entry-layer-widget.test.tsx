import { MantineProvider } from '#gateway/npm/mantine__core';
import { render } from '#gateway/npm/testing-library__react';
import { TestEntryLayerWidget } from './test-entry-layer-widget';
import { TestEntryLayerWidgetProxy } from './test-entry-layer-widget.proxy';
import { EntrySignatureStub } from '@assayer/shared/contracts/entry-signature/entry-signature.stub';
import { FunctionAnalysisStub } from '@assayer/shared/contracts/function-analysis/function-analysis.stub';

const NAMED_FUNCTION = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'decide',
    scopePath: ['*module*', 'decide'],
    params: [
      { name: 'a', type: { kind: 'number' } },
      { name: 'b', type: { kind: 'number' } },
    ],
    access: { kind: 'named' },
  }),
  branches: [],
  exits: [{ coverageId: 'decide/return@top', kind: 'return', guardPath: [], line: 4 }],
  cases: [
    { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 1 }], salient: true },
    { reachesPath: ['decide/return@top'], arrange: [{ kind: 'param', param: 'a', value: 2 }], salient: false },
  ],
});

const MODULE_ENTRY = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: '*module*',
    scopePath: ['*module*'],
    params: [],
    access: { kind: 'module' },
    exportName: 'message',
  }),
  branches: [],
  exits: [{ coverageId: '*module*/exit@top', kind: 'implicit', guardPath: [], line: 4 }],
  cases: [{ reachesPath: ['*module*/exit@top'], arrange: [] }],
});

const THROUGH_CALLER_ENTRY = FunctionAnalysisStub({
  entry: EntrySignatureStub({
    name: 'inner',
    scopePath: ['*module*', 'outer', 'inner'],
    params: [{ name: 'n', type: { kind: 'number' } }],
    access: { kind: 'through-caller', callerName: 'outer' },
  }),
  branches: [],
  exits: [{ coverageId: 'inner/return@then', kind: 'return', guardPath: [], line: 4 }],
  cases: [{ reachesPath: ['inner/return@then'], arrange: [{ kind: 'param', param: 'value', value: 6 }], salient: true }],
});

describe('TestEntryLayerWidget', () => {
  describe('a named function', () => {
    it('VALID: {two params, two cases} => the title carries the param list and the full case count, one row per case', () => {
      TestEntryLayerWidgetProxy();

      const { getByTestId, getAllByTestId } = render(<TestEntryLayerWidget fn={NAMED_FUNCTION} />, { wrapper: MantineProvider });

      expect(getByTestId('TEST_ENTRY').firstElementChild?.textContent).toBe('decide(a, b) · 2 cases');
      expect(getAllByTestId('TEST_CASE_ROW').map((element) => element.textContent)).toStrictEqual([
        'not run decide(1)',
        'not run decide(2)',
      ]);
    });
  });

  describe('a module entry', () => {
    it('VALID: {module entry with export message} => a bare label with no parens, and the row names the label', () => {
      TestEntryLayerWidgetProxy();

      const { getByTestId } = render(<TestEntryLayerWidget fn={MODULE_ENTRY} relPath={'src/message.ts'} />, { wrapper: MantineProvider });

      expect(getByTestId('TEST_ENTRY').firstElementChild?.textContent).toBe('message · 1 cases');
      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run message');
    });
  });

  describe('a through-caller entry', () => {
    it('VALID: {inner driven through outer} => the title is its own name, the row names the caller', () => {
      TestEntryLayerWidgetProxy();

      const { getByTestId } = render(<TestEntryLayerWidget fn={THROUGH_CALLER_ENTRY} />, { wrapper: MantineProvider });

      expect(getByTestId('TEST_ENTRY').firstElementChild?.textContent).toBe('inner(n) · 1 cases');
      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run outer(6)');
    });
  });
});
