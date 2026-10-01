import { entryLabelContract, symbolNameContract } from '@assayer/shared/contracts';
import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { ConditionNodeStub } from '@assayer/shared/contracts/condition-node/condition-node.stub';
import { ExitNodeStub } from '@assayer/shared/contracts/exit-node/exit-node.stub';
import { TypeDescriptorStub } from '@assayer/shared/contracts/type-descriptor/type-descriptor.stub';

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

  describe('a branchless callback whose return predicate is driven through the entry', () => {
    // `items.filter((n) => n > 5)` has no `if` — the true/false split rides the RETURN comparison, not a
    // branch — so this is the axis the earlier describe blocks never touch: they all give CALLBACK-shaped
    // scopes with `branches: [N_BRANCH]` and never set `predicateSignature`.
    const PRED_EXIT = ExitNodeStub({ coverageId: 'cb/return@top', guardPath: [], line: 2 });
    const PREDICATE = ConditionNodeStub({
      id: 'cb/return#leaf',
      operandParamName: 'n',
      operandType: { kind: 'number' },
      predicate: { kind: 'gt', literal: 5 },
    });
    const PREDICATE_CALLBACK = ScopeRecordStub({
      scopePath: ['*module*', 'run', 'cb'],
      name: 'cb',
      exported: false,
      access: { kind: 'unreachable' },
      params: [{ name: 'n', type: { kind: 'number' } }],
      returnType: { kind: 'boolean' },
      startLine: 2,
      endLine: 2,
      branches: [],
      exits: [PRED_EXIT],
      predicateSignature: PREDICATE,
    });
    const ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'number' } } }],
      returnType: { kind: 'array', element: { kind: 'number' } },
    });

    it('VALID: {cb(n) returns n > 5} => the predicate signature rides onto the entry the analysis carries', () => {
      const result = throughCallbackCasesTransformer({ callback: PREDICATE_CALLBACK, entry: ENTRY, arrayParam: symbolNameContract.parse('items') });

      expect(result.analysis.predicateSignature).toStrictEqual(PREDICATE);
    });

    it('VALID: {cb(n) returns n > 5} => splits into a satisfying and a violating element, each its own single-element array', () => {
      const result = throughCallbackCasesTransformer({ callback: PREDICATE_CALLBACK, entry: ENTRY, arrayParam: symbolNameContract.parse('items') });

      expect(result.analysis.cases).toStrictEqual([
        { reachesPath: ['cb/return@top'], arrange: [{ kind: 'array', param: 'items', value: [6] }], salient: true },
        { reachesPath: ['cb/return@top'], arrange: [{ kind: 'array', param: 'items', value: [5] }], salient: true },
      ]);
    });
  });

  describe('a callback whose element param is OBJECT-typed and the branch reads a sibling param', () => {
    // `items.map((item, idx) => idx > 2 ? 'big' : 'small')` — `item` (params[0], the steered element) is
    // object-typed and untouched by any branch; `idx` (params[1]) is what the branch actually reads. The
    // element binding `cause-arrange` builds for `item` therefore carries `kind: 'object'`, never `kind:
    // 'param'` — the arm `elementBinding`'s search must recognize or the element silently reads as `[]`.
    const OBJECT_IDX_BRANCH = BranchNodeStub({
      coverageId: 'cb/if:idx',
      condition: {
        kind: 'leaf',
        id: 'cb/if:idx#leaf',
        operandParamName: 'idx',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 2 },
      },
    });
    const OBJECT_THEN_EXIT = ExitNodeStub({
      coverageId: 'cb/return@then',
      guardPath: [{ branchCoverageId: 'cb/if:idx', arm: 'then' }],
      line: 3,
    });
    const OBJECT_ELSE_EXIT = ExitNodeStub({
      coverageId: 'cb/return@else',
      guardPath: [{ branchCoverageId: 'cb/if:idx', arm: 'else' }],
      line: 5,
    });
    const ITEM_TYPE = TypeDescriptorStub({
      kind: 'object',
      typeName: 'Item',
      properties: [{ name: 'label', type: { kind: 'string' } }],
    });
    const OBJECT_CALLBACK = ScopeRecordStub({
      scopePath: ['*module*', 'run', 'cb'],
      name: 'cb',
      exported: false,
      access: { kind: 'unreachable' },
      params: [
        { name: 'item', type: ITEM_TYPE },
        { name: 'idx', type: { kind: 'number' } },
      ],
      returnType: { kind: 'string' },
      startLine: 2,
      endLine: 5,
      branches: [OBJECT_IDX_BRANCH],
      exits: [OBJECT_THEN_EXIT, OBJECT_ELSE_EXIT],
    });
    const OBJECT_ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: ITEM_TYPE } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
    });

    it('VALID: {element param is an object} => the object element steers the array instead of an empty one', () => {
      const result = throughCallbackCasesTransformer({
        callback: OBJECT_CALLBACK,
        entry: OBJECT_ENTRY,
        arrayParam: symbolNameContract.parse('items'),
      });

      expect(result.analysis.cases).toStrictEqual([
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [{ label: 'abc123' }] }], salient: true },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [{ label: 'abc123' }] }], salient: true },
      ]);
    });
  });

  describe('a callback whose element param is itself ARRAY-typed and the branch reads a sibling param', () => {
    // `items.map((row, idx) => idx > 2 ? 'big' : 'small')` over `items: number[][]` — `row` (params[0])
    // is array-typed and untouched by any branch, so `cause-arrange` fans it out over every cardinality
    // (empty/one/many) and binds it with `kind: 'array'`, never `kind: 'param'`.
    const ARRAY_IDX_BRANCH = BranchNodeStub({
      coverageId: 'cb/if:idx',
      condition: {
        kind: 'leaf',
        id: 'cb/if:idx#leaf',
        operandParamName: 'idx',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 2 },
      },
    });
    const ARRAY_THEN_EXIT = ExitNodeStub({
      coverageId: 'cb/return@then',
      guardPath: [{ branchCoverageId: 'cb/if:idx', arm: 'then' }],
      line: 3,
    });
    const ARRAY_ELSE_EXIT = ExitNodeStub({
      coverageId: 'cb/return@else',
      guardPath: [{ branchCoverageId: 'cb/if:idx', arm: 'else' }],
      line: 5,
    });
    const ARRAY_CALLBACK = ScopeRecordStub({
      scopePath: ['*module*', 'run', 'cb'],
      name: 'cb',
      exported: false,
      access: { kind: 'unreachable' },
      params: [
        { name: 'row', type: { kind: 'array', element: { kind: 'number' } } },
        { name: 'idx', type: { kind: 'number' } },
      ],
      returnType: { kind: 'string' },
      startLine: 2,
      endLine: 5,
      branches: [ARRAY_IDX_BRANCH],
      exits: [ARRAY_THEN_EXIT, ARRAY_ELSE_EXIT],
    });
    const ARRAY_ENTRY = ScopeRecordStub({
      scopePath: ['*module*', 'run'],
      name: 'run',
      params: [{ name: 'items', type: { kind: 'array', element: { kind: 'array', element: { kind: 'number' } } } }],
      returnType: { kind: 'array', element: { kind: 'string' } },
    });

    it('VALID: {element param is a nested array} => each cardinality of the nested array steers the outer array', () => {
      const result = throughCallbackCasesTransformer({
        callback: ARRAY_CALLBACK,
        entry: ARRAY_ENTRY,
        arrayParam: symbolNameContract.parse('items'),
      });

      expect(result.analysis.cases).toStrictEqual([
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [[]] }], salient: true },
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [[7]] }], salient: false },
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [[7, 7]] }], salient: false },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [[]] }], salient: true },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [[7]] }], salient: false },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [[7, 7]] }], salient: false },
      ]);
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
