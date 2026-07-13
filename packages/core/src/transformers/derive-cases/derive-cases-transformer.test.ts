import { ParamDescriptorStub, BranchNodeStub, ExitNodeStub } from '@assayer/shared/contracts';

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
