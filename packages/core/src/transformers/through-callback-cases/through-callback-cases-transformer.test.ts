import { BranchNodeStub, ExitNodeStub, symbolNameContract } from '@assayer/shared/contracts';

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

      expect(result.entry.access).toStrictEqual({ kind: 'through-caller', callerName: 'run' });
    });

    it('VALID: {a callback branch on n} => each arm steers the single element of the array the entry receives', () => {
      const result = throughCallbackCasesTransformer({ callback: CALLBACK, entry: ENTRY, arrayParam: symbolNameContract.parse('items') });

      expect(result.cases).toStrictEqual([
        { reachesPath: ['cb/return@then'], arrange: [{ kind: 'array', param: 'items', value: [6] }], salient: true },
        { reachesPath: ['cb/return@else'], arrange: [{ kind: 'array', param: 'items', value: [5] }], salient: true },
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

      expect(result.cases).toStrictEqual([
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
