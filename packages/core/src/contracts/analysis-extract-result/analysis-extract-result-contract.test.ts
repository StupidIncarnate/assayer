import { analysisExtractResultContract } from './analysis-extract-result-contract';
import { AnalysisExtractResultStub } from './analysis-extract-result.stub';

describe('analysisExtractResultContract', () => {
  describe('valid extract results', () => {
    it('VALID: {stub default} => parses a successful empty result', () => {
      const extractResult = AnalysisExtractResultStub();

      const result = analysisExtractResultContract.parse(extractResult);

      expect(result).toStrictEqual(extractResult);
    });

    it('VALID: {success: false, error} => parses a positioned parse error', () => {
      const result = analysisExtractResultContract.parse({
        success: false,
        error: { line: 1, column: 11, message: 'Expression expected.' },
      });

      expect(result).toStrictEqual({
        success: false,
        error: { line: 1, column: 11, message: 'Expression expected.' },
      });
    });
  });

  describe('invalid extract results', () => {
    it('INVALID: {success: "maybe"} => throws validation error', () => {
      expect(() => {
        return analysisExtractResultContract.parse({ success: 'maybe' });
      }).toThrow(/Invalid discriminator/u);
    });
  });
});
