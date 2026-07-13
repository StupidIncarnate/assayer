import { fileAnalysisContract } from './file-analysis-contract';
import { FileAnalysisStub } from './file-analysis.stub';

describe('fileAnalysisContract', () => {
  describe('valid file analyses', () => {
    it('VALID: {stub default} => parses to the same shape', () => {
      const analysis = FileAnalysisStub();

      const result = fileAnalysisContract.parse(analysis);

      expect(result).toStrictEqual(analysis);
    });

    it('VALID: {functions: [], enrichment: []} => parses an empty analysis', () => {
      const analysis = FileAnalysisStub({ functions: [], enrichment: [] });

      const result = fileAnalysisContract.parse(analysis);

      expect(result).toStrictEqual(analysis);
    });
  });

  describe('invalid file analyses', () => {
    it('INVALID: {} => throws validation error for the missing functions array', () => {
      expect(() => {
        return fileAnalysisContract.parse({ enrichment: [] });
      }).toThrow(/Required/u);
    });
  });
});
