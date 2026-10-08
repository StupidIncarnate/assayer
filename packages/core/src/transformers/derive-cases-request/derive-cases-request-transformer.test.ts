import { representativeValueContract } from '@assayer/shared/contracts';
import { BranchNodeStub } from '@assayer/shared/contracts/branch-node/branch-node.stub';
import { ConditionNodeStub } from '@assayer/shared/contracts/condition-node/condition-node.stub';
import { ExitNodeStub } from '@assayer/shared/contracts/exit-node/exit-node.stub';

import { ScopeRecordStub } from '../../contracts/scope-record/scope-record.stub';
import { IndexDemandStub } from '../../contracts/index-demand/index-demand.stub';
import { deriveCasesRequestTransformer } from './derive-cases-request-transformer';

const VALUE = 'value';
const THREE = representativeValueContract.parse(3);

const BRANCH = BranchNodeStub({
  coverageId: 'inner/if:value',
  condition: { kind: 'leaf', id: 'inner/if:value#leaf', operandParamName: 'value', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } },
});
const EXIT = ExitNodeStub({ coverageId: 'inner/return@then', guardPath: [{ branchCoverageId: 'inner/if:value', arm: 'then' }], line: 3 });

const SCOPE = ScopeRecordStub({
  scopePath: ['*module*', 'inner'],
  name: 'inner',
  params: [{ name: 'value', type: { kind: 'number' } }],
  startLine: 2,
  endLine: 4,
  branches: [BRANCH],
  exits: [EXIT],
});

describe('deriveCasesRequestTransformer', () => {
  describe('params', () => {
    it("VALID: {a scope's own params} => the request carries exactly those params", () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: undefined, envDrivable: false, harness: undefined });

      expect(result.params).toStrictEqual([{ name: 'value', type: { kind: 'number' } }]);
    });

    it('VALID: {an explicit empty list} => the request carries no params, regardless of what the scope declares', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: [], welds: undefined, envDrivable: true, harness: undefined });

      expect(result.params).toStrictEqual([]);
    });
  });

  describe('welds', () => {
    it('VALID: {welds is undefined} => the branches ride through unstamped', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: undefined, envDrivable: false, harness: undefined });

      expect(result.branches).toStrictEqual([BRANCH]);
    });

    it('VALID: {welds maps value->3} => the branches carry the stamped condition', () => {
      const result = deriveCasesRequestTransformer({
        scope: SCOPE,
        params: SCOPE.params,
        welds: new Map([[VALUE, THREE]]),
        envDrivable: false,
        harness: undefined,
      });

      expect(result.branches).toStrictEqual([{ ...BRANCH, condition: { ...BRANCH.condition, operandConstValue: 3 } }]);
    });

    it('EMPTY: {an empty weld map} => the branches are returned unchanged, same as undefined', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: new Map(), envDrivable: false, harness: undefined });

      expect(result.branches).toStrictEqual([BRANCH]);
    });
  });

  describe('exits', () => {
    it("VALID: {a scope's exits} => the request carries them unchanged, there is no per-caller choice", () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: undefined, envDrivable: false, harness: undefined });

      expect(result.exits).toStrictEqual([EXIT]);
    });
  });

  describe('envDrivable', () => {
    it('VALID: {true} => the request carries true', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: [], welds: undefined, envDrivable: true, harness: undefined });

      expect(result.envDrivable).toBe(true);
    });

    it('VALID: {false} => the request carries false', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: undefined, envDrivable: false, harness: undefined });

      expect(result.envDrivable).toBe(false);
    });
  });

  describe('returnPredicate', () => {
    it('VALID: {scope.predicateSignature is set} => the request carries it as returnPredicate', () => {
      const predicate = ConditionNodeStub({ id: 'inner/return#leaf', operandParamName: 'value', operandType: { kind: 'number' }, predicate: { kind: 'gt', literal: 5 } });
      const predicateScope = ScopeRecordStub({ ...SCOPE, branches: [], predicateSignature: predicate });

      const result = deriveCasesRequestTransformer({ scope: predicateScope, params: predicateScope.params, welds: undefined, envDrivable: false, harness: undefined });

      expect(result.returnPredicate).toStrictEqual(predicate);
    });

    it('EMPTY: {scope.predicateSignature is absent} => the request carries no returnPredicate key at all', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: undefined, envDrivable: false, harness: undefined });

      expect('returnPredicate' in result).toBe(false);
    });
  });

  describe('harness', () => {
    it('VALID: {a harness spec} => the request carries it', () => {
      const result = deriveCasesRequestTransformer({
        scope: SCOPE,
        params: SCOPE.params,
        welds: undefined,
        envDrivable: false,
        harness: { entry: 'inner', params: ['cb'] },
      });

      expect(result.harness).toStrictEqual({ entry: 'inner', params: ['cb'] });
    });

    it('EMPTY: {harness is undefined} => the request carries no harness key at all', () => {
      const result = deriveCasesRequestTransformer({ scope: SCOPE, params: SCOPE.params, welds: undefined, envDrivable: false, harness: undefined });

      expect('harness' in result).toBe(false);
    });
  });

  describe('indexDemands', () => {
    it('VALID: {scope has indexDemands} => the request carries them', () => {
      const demand = IndexDemandStub();
      const scopeWithDemands = ScopeRecordStub({ ...SCOPE, indexDemands: [demand] });
      const result = deriveCasesRequestTransformer({
        scope: scopeWithDemands,
        params: scopeWithDemands.params,
        welds: undefined,
        envDrivable: false,
        harness: undefined,
      });

      expect(result.indexDemands).toStrictEqual([demand]);
    });

    it('EMPTY: {scope has no indexDemands} => the request carries no indexDemands key at all', () => {
      const result = deriveCasesRequestTransformer({
        scope: SCOPE,
        params: SCOPE.params,
        welds: undefined,
        envDrivable: false,
        harness: undefined,
      });

      expect('indexDemands' in result).toBe(false);
    });
  });
});
