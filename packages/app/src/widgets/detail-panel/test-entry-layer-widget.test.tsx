import { themedRenderMiddleware } from '../../middleware/themed-render/themed-render-middleware';
import { TestEntryLayerWidget } from './test-entry-layer-widget';
import { TestEntryLayerWidgetProxy } from './test-entry-layer-widget.proxy';
import { EntrySignatureStub, FunctionAnalysisStub, RelPathStub } from '@assayer/shared/contracts';

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

      const { getByTestId, getAllByTestId } = themedRenderMiddleware({
        ui: <TestEntryLayerWidget fn={NAMED_FUNCTION} />,
      });

      expect(getByTestId('TEST_ENTRY').firstElementChild?.textContent).toBe('decide(a, b) · 2 cases');
      expect(getAllByTestId('TEST_CASE_ROW').map((element) => element.textContent)).toStrictEqual([
        'not run decide(1) → reaches L4',
        'not run decide(2) → reaches L4',
      ]);
    });
  });

  describe('a module entry', () => {
    it('VALID: {module entry with export message} => a bare label with no parens, and the row names the label', () => {
      TestEntryLayerWidgetProxy();

      const { getByTestId } = themedRenderMiddleware({
        ui: <TestEntryLayerWidget fn={MODULE_ENTRY} relPath={RelPathStub({ value: 'src/message.ts' })} />,
      });

      expect(getByTestId('TEST_ENTRY').firstElementChild?.textContent).toBe('message · 1 cases');
      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run message → reaches L4');
    });
  });

  describe('a through-caller entry', () => {
    it('VALID: {inner driven through outer} => the title is its own name, the row names the caller', () => {
      TestEntryLayerWidgetProxy();

      const { getByTestId } = themedRenderMiddleware({
        ui: <TestEntryLayerWidget fn={THROUGH_CALLER_ENTRY} />,
      });

      expect(getByTestId('TEST_ENTRY').firstElementChild?.textContent).toBe('inner(n) · 1 cases');
      expect(getByTestId('TEST_CASE_ROW').textContent).toBe('not run outer(6) → reaches L4');
    });
  });
});
