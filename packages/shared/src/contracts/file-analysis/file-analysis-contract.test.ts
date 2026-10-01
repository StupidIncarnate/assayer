import { DarkSpotStub } from '../dark-spot/dark-spot.stub';
import { UndrivenEntryStub } from '../undriven-entry/undriven-entry.stub';
import { LintEntryStub } from '../lint-entry/lint-entry.stub';
import { DeclaredTypeStub } from '../declared-type/declared-type.stub';

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

  describe('the dark-spot channel', () => {
    it('VALID: {a dark spot} => the analysis carries the syntax the walk recognized but could not follow', () => {
      const analysis = FileAnalysisStub({ darkSpots: [DarkSpotStub()] });

      const result = fileAnalysisContract.parse(analysis);

      expect(result.darkSpots).toStrictEqual([DarkSpotStub()]);
    });
  });

  describe('the undriven channel', () => {
    it('VALID: {an undriven entry} => the analysis carries the scope it understood but cannot reach', () => {
      const analysis = FileAnalysisStub({ undriven: [UndrivenEntryStub()] });

      const result = fileAnalysisContract.parse(analysis);

      expect(result.undriven).toStrictEqual([UndrivenEntryStub()]);
    });
  });

  describe('the lint channel', () => {
    it('VALID: {a lint entry} => the analysis carries the pattern the repo should change', () => {
      const analysis = FileAnalysisStub({ lints: [LintEntryStub()] });

      const result = fileAnalysisContract.parse(analysis);

      expect(result.lints).toStrictEqual([LintEntryStub()]);
    });
  });

  describe('the declared-types channel', () => {
    it('VALID: {a declared type} => the analysis carries the shape and its full property list', () => {
      const analysis = FileAnalysisStub({ declaredTypes: [DeclaredTypeStub()] });

      const result = fileAnalysisContract.parse(analysis);

      expect(result.declaredTypes).toStrictEqual([DeclaredTypeStub()]);
    });
  });

  describe('invalid file analyses', () => {
    // A file analysis is REQUIRED to state every one of its own channels — an omitted one reads as a
    // file with nothing to admit there, which is exactly the reads-as-complete lie the whole model
    // exists to prevent. Derived from the contract's own shape so a channel added later is proven
    // required automatically, instead of silently passing unomission-tested.
    const requiredFields = Object.keys(fileAnalysisContract.shape);

    it.each(requiredFields)('INVALID: {%s omitted} => throws validation error', (field) => {
      const full = FileAnalysisStub();
      const partial = Object.fromEntries(Object.entries(full).filter(([key]) => key !== field));

      expect(() => fileAnalysisContract.parse(partial)).toThrow(/Invalid input: expected array, received undefined/u);
    });
  });
});
