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

  describe('the gap channel', () => {
    it('VALID: {an input gap} => the analysis carries it, so the file admits it before anything runs', () => {
      const analysis = FileAnalysisStub({ gaps: [{ name: 'audit', reason: 'the fill seam refuses `report`' }] });

      const result = fileAnalysisContract.parse(analysis);

      expect(result.gaps).toStrictEqual([{ name: 'audit', reason: 'the fill seam refuses `report`' }]);
    });
  });

  describe('invalid file analyses', () => {
    it('INVALID: {} => throws validation error for the missing functions array', () => {
      expect(() => {
        return fileAnalysisContract.parse({ enrichment: [] });
      }).toThrow(/Required/u);
    });

    it('INVALID: {no gaps} => throws, since an omitted gap reads as a file with nothing to supply', () => {
      expect(() => {
        return fileAnalysisContract.parse({
          functions: [],
          enrichment: [],
          darkSpots: [],
          undriven: [],
          lints: [],
          declaredTypes: [],
        });
      }).toThrow(/Required/u);
    });
  });
});
