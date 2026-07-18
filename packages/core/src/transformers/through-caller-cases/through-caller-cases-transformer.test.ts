import { BranchNodeStub, ExitNodeStub } from '@assayer/shared/contracts';

import { CallSiteStub } from '../../contracts/call-site/call-site.stub';
import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { throughCallerCasesTransformer } from './through-caller-cases-transformer';

// A private `inner(n)` branching on `n > 5`, with a then-exit and an else-exit keyed on that branch.
const N_BRANCH = BranchNodeStub({
  coverageId: 'inner/if:n',
  condition: {
    kind: 'leaf',
    id: 'inner/if:n#leaf',
    operandParamName: 'n',
    operandType: { kind: 'number' },
    predicate: { kind: 'gt', literal: 5 },
  },
});
const THEN_EXIT = ExitNodeStub({
  coverageId: 'inner/return@then',
  guardPath: [{ branchCoverageId: 'inner/if:n', arm: 'then' }],
  line: 3,
});
const ELSE_EXIT = ExitNodeStub({
  coverageId: 'inner/return@else',
  guardPath: [{ branchCoverageId: 'inner/if:n', arm: 'else' }],
  line: 6,
});

const CALLEE = ScopeRecordStub({
  scopePath: ['*module*', 'outer', 'inner'],
  name: 'inner',
  exported: false,
  access: { kind: 'unreachable' },
  params: [{ name: 'n', type: { kind: 'number' } }],
  returnType: { kind: 'string' },
  startLine: 2,
  endLine: 7,
  branches: [N_BRANCH],
  exits: [THEN_EXIT, ELSE_EXIT],
});

describe('throughCallerCasesTransformer', () => {
  describe('a callee whose only param is passed straight through', () => {
    const CALLER = ScopeRecordStub({
      scopePath: ['*module*', 'outer'],
      name: 'outer',
      params: [{ name: 'value', type: { kind: 'number' } }],
    });
    const CALL = CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 }, args: [{ kind: 'param-ref', paramName: 'value' }] });

    it('VALID: {inner(value)} => a through-caller entry naming the caller the runner drives', () => {
      const result = throughCallerCasesTransformer({ callee: CALLEE, caller: CALLER, call: CALL });

      expect(result.entry.access).toStrictEqual({ kind: 'through-caller', callerName: 'outer' });
    });

    it('VALID: {inner(value)} => the callee`s exits, arranged in the caller`s parameter', () => {
      const result = throughCallerCasesTransformer({ callee: CALLEE, caller: CALLER, call: CALL });

      expect(result.cases).toStrictEqual([
        { reachesExit: 'inner/return@then', arrange: [{ kind: 'param', param: 'value', value: 6 }] },
        { reachesExit: 'inner/return@else', arrange: [{ kind: 'param', param: 'value', value: 5 }] },
      ]);
    });
  });

  describe('a caller with a parameter the callee does not consume', () => {
    const CALLER = ScopeRecordStub({
      scopePath: ['*module*', 'outer'],
      name: 'outer',
      params: [
        { name: 'value', type: { kind: 'number' } },
        { name: 'extra', type: { kind: 'number' } },
      ],
    });
    const CALL = CallSiteStub({ callee: { target: 'local', name: 'inner', startLine: 2 }, args: [{ kind: 'param-ref', paramName: 'value' }] });

    it('VALID: {inner(value), caller also takes extra} => extra is filled representatively, in caller param order', () => {
      const result = throughCallerCasesTransformer({ callee: CALLEE, caller: CALLER, call: CALL });

      expect(result.cases).toStrictEqual([
        {
          reachesExit: 'inner/return@then',
          arrange: [
            { kind: 'param', param: 'value', value: 6 },
            { kind: 'param', param: 'extra', value: 0 },
          ],
        },
        {
          reachesExit: 'inner/return@else',
          arrange: [
            { kind: 'param', param: 'value', value: 5 },
            { kind: 'param', param: 'extra', value: 0 },
          ],
        },
      ]);
    });
  });
});
