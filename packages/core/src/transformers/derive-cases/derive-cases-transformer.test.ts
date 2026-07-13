import { ParamDescriptorStub, BranchNodeStub, ExitNodeStub, TypeDescriptorStub } from '@assayer/shared/contracts';

import { deriveCasesTransformer } from './derive-cases-transformer';

describe('deriveCasesTransformer', () => {
  describe('guarded exits', () => {
    it('VALID: {if-then exit} => arranges the empty string reaching the then exit', () => {
      const cases = deriveCasesTransformer({
        params: [ParamDescriptorStub()],
        branches: [BranchNodeStub()],
        exits: [ExitNodeStub()],
      });

      expect(cases).toStrictEqual([
        { reachesExit: 'formatGreeting/return@if-then', arrange: [{ param: 'name', value: '' }] },
      ]);
    });

    it('VALID: {if-else exit} => arranges a non-empty string reaching the else exit', () => {
      const elseExit = ExitNodeStub({
        coverageId: 'formatGreeting/return@if-else',
        guardPath: [{ branchCoverageId: 'formatGreeting/if:name.length===0', arm: 'else' }],
        line: 6,
      });

      const cases = deriveCasesTransformer({
        params: [ParamDescriptorStub()],
        branches: [BranchNodeStub()],
        exits: [elseExit],
      });

      expect(cases).toStrictEqual([
        { reachesExit: 'formatGreeting/return@if-else', arrange: [{ param: 'name', value: 'a' }] },
      ]);
    });
  });

  describe('literal-union operand', () => {
    it('VALID: {eq on a 3-member union} => then binds the member, else fans out one case per other member', () => {
      const unionType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'a' }),
          TypeDescriptorStub({ kind: 'literal', value: 'b' }),
          TypeDescriptorStub({ kind: 'literal', value: 'c' }),
        ],
      });
      const branch = BranchNodeStub({
        coverageId: "classify/if:status === 'a'",
        conditionText: "status === 'a'",
        operandParamName: 'status',
        operandType: unionType,
        predicate: { kind: 'eq', literal: 'a' },
      });

      const cases = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'status', type: unionType })],
        branches: [branch],
        exits: [
          ExitNodeStub({
            coverageId: 'classify/return@if-then',
            guardPath: [{ branchCoverageId: "classify/if:status === 'a'", arm: 'then' }],
          }),
          ExitNodeStub({
            coverageId: 'classify/return@if-else',
            guardPath: [{ branchCoverageId: "classify/if:status === 'a'", arm: 'else' }],
          }),
        ],
      });

      expect(cases).toStrictEqual([
        { reachesExit: 'classify/return@if-then', arrange: [{ param: 'status', value: 'a' }] },
        { reachesExit: 'classify/return@if-else', arrange: [{ param: 'status', value: 'b' }] },
        { reachesExit: 'classify/return@if-else', arrange: [{ param: 'status', value: 'c' }] },
      ]);
    });
  });

  describe('switch-desugared operand (exhaustive default)', () => {
    it('VALID: {switch over 3-member union} => each case binds its member and default binds the single uncovered member', () => {
      const unionType = TypeDescriptorStub({
        kind: 'union',
        members: [
          TypeDescriptorStub({ kind: 'literal', value: 'get' }),
          TypeDescriptorStub({ kind: 'literal', value: 'post' }),
          TypeDescriptorStub({ kind: 'literal', value: 'delete' }),
        ],
      });
      const getBranch = BranchNodeStub({
        coverageId: "routeLabel/switch:method === 'get'",
        kind: 'switch',
        conditionText: "method === 'get'",
        operandParamName: 'method',
        operandType: unionType,
        predicate: { kind: 'eq', literal: 'get' },
      });
      const postBranch = BranchNodeStub({
        coverageId: "routeLabel/switch:method === 'post'",
        kind: 'switch',
        conditionText: "method === 'post'",
        operandParamName: 'method',
        operandType: unionType,
        predicate: { kind: 'eq', literal: 'post' },
      });

      const cases = deriveCasesTransformer({
        params: [ParamDescriptorStub({ name: 'method', type: unionType })],
        branches: [getBranch, postBranch],
        exits: [
          ExitNodeStub({
            coverageId: "routeLabel/return@switch:'get'",
            guardPath: [{ branchCoverageId: "routeLabel/switch:method === 'get'", arm: 'then' }],
            line: 4,
          }),
          ExitNodeStub({
            coverageId: "routeLabel/return@switch:'post'",
            guardPath: [{ branchCoverageId: "routeLabel/switch:method === 'post'", arm: 'then' }],
            line: 6,
          }),
          ExitNodeStub({
            coverageId: 'routeLabel/return@switch:default',
            guardPath: [
              { branchCoverageId: "routeLabel/switch:method === 'get'", arm: 'else' },
              { branchCoverageId: "routeLabel/switch:method === 'post'", arm: 'else' },
            ],
            line: 8,
          }),
        ],
      });

      expect(cases).toStrictEqual([
        { reachesExit: "routeLabel/return@switch:'get'", arrange: [{ param: 'method', value: 'get' }] },
        { reachesExit: "routeLabel/return@switch:'post'", arrange: [{ param: 'method', value: 'post' }] },
        { reachesExit: 'routeLabel/return@switch:default', arrange: [{ param: 'method', value: 'delete' }] },
      ]);
    });
  });

  describe('unguarded exits', () => {
    it('EMPTY: {no params, implicit exit} => arranges nothing reaching the implicit exit', () => {
      const cases = deriveCasesTransformer({
        params: [],
        branches: [],
        exits: [ExitNodeStub({ coverageId: 'run/exit@implicit', kind: 'implicit', guardPath: [], line: 5 })],
      });

      expect(cases).toStrictEqual([{ reachesExit: 'run/exit@implicit', arrange: [] }]);
    });
  });
});
