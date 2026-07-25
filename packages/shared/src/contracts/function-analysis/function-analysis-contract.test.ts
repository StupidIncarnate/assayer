import { ConditionNodeStub } from '../condition-node/condition-node.stub';

import { functionAnalysisContract } from './function-analysis-contract';
import { FunctionAnalysisStub } from './function-analysis.stub';

describe('functionAnalysisContract', () => {
  describe('valid function analyses', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const analysis = FunctionAnalysisStub();

      const result = functionAnalysisContract.parse(analysis);

      expect(result).toStrictEqual(analysis);
    });

    // The comparison that tells an entry's two return values apart — the only axis a branchless
    // predicate has. Every consume-time overlay re-derives an entry it drives FROM this model, and one
    // that cannot see the axis hands back fewer cases.
    it('VALID: {a predicate entry} => carries its return comparison as predicateSignature', () => {
      const analysis = FunctionAnalysisStub({ predicateSignature: ConditionNodeStub() });

      const result = functionAnalysisContract.parse(analysis);

      expect(result.predicateSignature).toStrictEqual(ConditionNodeStub());
    });

    // An entry whose body is not one comparison says so by carrying nothing, never by carrying a
    // placeholder comparison nothing published.
    it('EMPTY: {no return comparison} => predicateSignature is absent', () => {
      const result = functionAnalysisContract.parse(FunctionAnalysisStub());

      expect(result.predicateSignature).toBe(undefined);
    });
  });

  describe('invalid function analyses', () => {
    it('INVALID: {} => throws validation error for the missing entry', () => {
      expect(() => {
        return functionAnalysisContract.parse({ branches: [], exits: [], cases: [] });
      }).toThrow(/Required/u);
    });
  });
});
