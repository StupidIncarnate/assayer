import { BranchNodeStub, entryLabelContract, ExitNodeStub, symbolNameContract } from '@assayer/shared/contracts';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { throughCallbackCasesTransformer } from './through-callback-cases-transformer';

// A callback `(n) => { if (n > 5) return 'big'; return 'small'; }` — a then-exit and an else-exit keyed
// on its own `n > 5` branch, exactly like a private function's branch.
const N_BRANCH = BranchNodeStub({
  coverageId: 'cb/if:n',
  condition: {
    kind: 'leaf',
    id: 'cb/if:n#leaf',
    operandParamName: 'n',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  },
});
const THEN_EXIT = ExitNodeStub({ coverageId: 'cb/return@then', guardPath: [{ branchCoverageId: 'cb/if:n', arm: 'then' }], line: 3 });
const ELSE_EXIT = ExitNodeStub({ coverageId: 'cb/return@else', guardPath: [{ branchCoverageId: 'cb/if:n', arm: 'else' }], line: 5 });

const CALLBACK = ScopeRecordStub({
  scopePath: ['*module*', 'run', 'cb'],
  name: 'cb',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  returnType: { kind: 'string' },
  startLine: 2,
  endLine: 5,
  branches: [N_BRANCH],
  exits: [THEN_EXIT, ELSE_EXIT],
});

describe('throughCallbackCasesTransformer', () => {
  describe('a callback branching on the element of the entry`s array param', () => {
    const ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
    });

    it('VALID: {a callback branch on n} => a through-caller entry naming the entry the runner drives', () => {
      const result = throughCallbackCasesTransformer({ callback: CALLBACK, entry: ENTRY, arrayParam: symbolNameContract.parse('items') });

      expect(result.analysis.entry.access).toStrictEqual({ kind: 'through-caller', callerName: 'run' });
    });

    it('VALID: {a callback branch on n} => each arm steers the single element of the array the entry receives', () => {
      const result = throughCallbackCasesTransformer({ callback: CALLBACK, entry: ENTRY, arrayParam: symbolNameContract.parse('items') });

      expect(result.analysis.cases).toStrictEqual([
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [6] }], salient: true },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [5] }], salient: true },
      ]);
    });
  });

  // A5: the interpreter applies an `array` binding as ONE positional argument UNLESS it is marked
  // `rest` — a `...items: number[]` the entry maps over must SPREAD, not nest, or `items` binds to
  // `[[6]]` instead of `[6]`.
  describe('the entry`s array param is a REST parameter', () => {
    const REST_ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } }, optional: true, rest: true }],
      returnType: { kind: 'array', element: { kind: 'string' } },
    });

    it('VALID: {a callback branch on n} => each steered element is marked rest: true', () => {
      const result = throughCallbackCasesTransformer({
        callback: CALLBACK,
        entry: REST_ENTRY,
        arrayParam: symbolNameContract.parse('items'),
      });

      expect(result.analysis.cases).toStrictEqual([
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [6], rest: true }], salient: true },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [5], rest: true }], salient: true },
      ]);
    });
  });

  describe('a callback whose own parameter the fill seam refuses', () => {
    // The callback's `name` is a structural projection, so its refusal cannot be filed under it — the
    // gap goes to the HOST a reader drives, and `owner` carries the label that names the callback.
    const SINK_CALLBACK = ScopeRecordStub({
      scopePath: ['*module*', 'run', 'cb'],
      name: 'cb',
      exported: false,
      access: { kind: 'unreachable' },
      params: [{ name: 'sink', type: { kind: 'callable', text: '(m: string) => void' } }],
      returnType: { kind: 'string' },
      startLine: 2,
      endLine: 5,
      branches: [],
      exits: [ExitNodeStub({ coverageId: 'cb/return@top', guardPath: [], line: 3 })],
    });
    const ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
    });

    it('VALID: {a callback param the seam refuses} => no case, and the refusal rides back tagged with the label', () => {
      const result = throughCallbackCasesTransformer({
        callback: SINK_CALLBACK,
        entry: ENTRY,
        arrayParam: symbolNameContract.parse('items'),
        label: entryLabelContract.parse('run › items.map((sink) => …) L2'),
      });

      expect({ cases: result.analysis.cases, unfillable: result.unfillable }).toStrictEqual({
        cases: [],
        unfillable: [{ param: 'sink', type: '(m: string) => void', owner: 'run › items.map((sink) => …) L2' }],
      });
    });
  });

  describe('an entry with a scalar param the callback does not consume', () => {
    const ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [
        { name: 'items', type: { kind: 'array', element: { kind: 'number' } } },
        { name: 'factor', type: { kind: 'number' } },
      ],
      returnType: { kind: 'array', element: { kind: 'string' } },
    });

    it('VALID: {entry also takes factor} => factor is filled representatively, in entry param order', () => {
      const result = throughCallbackCasesTransformer({ callback: CALLBACK, entry: ENTRY, arrayParam: symbolNameContract.parse('items') });

      expect(result.analysis.cases).toStrictEqual([
        {
          reachesPath: ['cb/return@then'],
          arrange: [
            { kind: 'array', param: 'items', value: [6] },
            { kind: 'param', param: 'factor', value: 7 },
          ],
          salient: true,
        },
        {
          reachesPath: ['cb/return@else'],
          arrange: [
            { kind: 'array', param: 'items', value: [5] },
            { kind: 'param', param: 'factor', value: 7 },
          ],
          salient: true,
        },
      ]);
    });
  });
});
