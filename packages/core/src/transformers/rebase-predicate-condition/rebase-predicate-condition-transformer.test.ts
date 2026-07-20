import { ConditionLeafStub, CoverageIdStub, SymbolNameStub, conditionNodeContract } from '@assayer/shared/contracts';

import { rebasePredicateConditionTransformer } from './rebase-predicate-condition-transformer';

const BRANCH_ID = CoverageIdStub({ value: '*module*/classify/if:CallExpression,id:tooBig,id:x' });
const N_TO_X = new Map([[SymbolNameStub({ value: 'n' }), SymbolNameStub({ value: 'x' })]]);

describe('rebasePredicateConditionTransformer', () => {
  describe('a leaf whose operand the caller passed straight through', () => {
    it('VALID: {n > 50, n↦x} => the comparison rebased onto x, re-minted under the caller branch, call anchor dropped', () => {
      const node = ConditionLeafStub({
        id: '*module*/tooBig/predicate#leaf',
        operandParamName: 'n',
        operandCallPosition: { line: 6, column: 7 },
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 50 },
      });

      const result = rebasePredicateConditionTransformer({ node, branchCoverageId: BRANCH_ID, path: [], toCallerParam: N_TO_X });

      expect(result).toStrictEqual({
        kind: 'leaf',
        id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf',
        operandParamName: 'x',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 50 },
      });
    });
  });

  describe('a leaf the caller cannot steer', () => {
    it('EMPTY: {operand not in the map} => undefined, since no caller input reaches it', () => {
      const node = ConditionLeafStub({
        id: '*module*/tooBig/predicate#leaf',
        operandParamName: 'other',
        operandType: { kind: 'number' },
        predicate: { kind: 'gt', literal: 50 },
      });

      const result = rebasePredicateConditionTransformer({ node, branchCoverageId: BRANCH_ID, path: [], toCallerParam: N_TO_X });

      expect(result).toBe(undefined);
    });

    it('EMPTY: {leaf with no operandParamName} => undefined, since a call/literal operand names no param', () => {
      const node = conditionNodeContract.parse({
        kind: 'leaf',
        id: '*module*/tooBig/predicate#leaf',
        operandType: { kind: 'boolean' },
        predicate: { kind: 'truthy' },
      });

      const result = rebasePredicateConditionTransformer({ node, branchCoverageId: BRANCH_ID, path: [], toCallerParam: N_TO_X });

      expect(result).toBe(undefined);
    });
  });

  describe('connectives address each leaf by its path', () => {
    it('VALID: {n > 50 && n < 90, n↦x} => an and over two rebased leaves at #leaf.0 and #leaf.1', () => {
      const node = conditionNodeContract.parse({
        kind: 'and',
        left: { kind: 'leaf', id: 'callee#leaf.0', operandParamName: 'n', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 50 } },
        right: { kind: 'leaf', id: 'callee#leaf.1', operandParamName: 'n', operandType: { kind: 'number' }, predicate: { kind: 'lt', literal: 90 } },
      });

      const result = rebasePredicateConditionTransformer({ node, branchCoverageId: BRANCH_ID, path: [], toCallerParam: N_TO_X });

      expect(result).toStrictEqual({
        kind: 'and',
        left: {
          kind: 'leaf',
          id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf.0',
          operandParamName: 'x',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 50 },
        },
        right: {
          kind: 'leaf',
          id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf.1',
          operandParamName: 'x',
          operandType: { kind: 'number' },
          predicate: { kind: 'lt', literal: 90 },
        },
      });
    });

    it('VALID: {!(n > 50), n↦x} => a not wrapping the rebased leaf at #leaf.0', () => {
      const node = conditionNodeContract.parse({
        kind: 'not',
        operand: { kind: 'leaf', id: 'callee#leaf.0', operandParamName: 'n', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 50 } },
      });

      const result = rebasePredicateConditionTransformer({ node, branchCoverageId: BRANCH_ID, path: [], toCallerParam: N_TO_X });

      expect(result).toStrictEqual({
        kind: 'not',
        operand: {
          kind: 'leaf',
          id: '*module*/classify/if:CallExpression,id:tooBig,id:x#leaf.0',
          operandParamName: 'x',
          operandType: { kind: 'number' },
          predicate: { kind: 'gt', literal: 50 },
        },
      });
    });

    it('EMPTY: {and where one leaf is unmapped} => undefined, since a partial rebase would miskey a leaf', () => {
      const node = conditionNodeContract.parse({
        kind: 'and',
        left: { kind: 'leaf', id: 'callee#leaf.0', operandParamName: 'n', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 50 } },
        right: { kind: 'leaf', id: 'callee#leaf.1', operandParamName: 'other', operandType: { kind: 'number' }, predicate: { kind: 'lt', literal: 90 } },
      });

      const result = rebasePredicateConditionTransformer({ node, branchCoverageId: BRANCH_ID, path: [], toCallerParam: N_TO_X });

      expect(result).toBe(undefined);
    });
  });
});
