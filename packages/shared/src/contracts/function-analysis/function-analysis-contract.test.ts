import { functionAnalysisContract } from './function-analysis-contract';
import { FunctionAnalysisStub } from './function-analysis.stub';

describe('functionAnalysisContract', () => {
  describe('valid function analyses', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const analysis = FunctionAnalysisStub();

      const result = functionAnalysisContract.parse(analysis);

      expect(result).toStrictEqual(analysis);
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
