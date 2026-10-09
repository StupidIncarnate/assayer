import { GeneratedFileStub } from '../generated-file/generated-file.stub';
import { ManifestEntryStub } from '../manifest-entry/manifest-entry.stub';
import { RefusedSpecimenStub } from '../refused-specimen/refused-specimen.stub';
import { generationResultContract } from './generation-result-contract';
import { GenerationResultStub } from './generation-result.stub';

describe('generationResultContract', () => {
  describe('valid results', () => {
    it('VALID: {stub default} => parses one file, one refusal and one manifest entry', () => {
      const result = generationResultContract.parse(GenerationResultStub());

      expect(result).toStrictEqual({
        files: [GeneratedFileStub()],
        refused: [RefusedSpecimenStub()],
        manifest: [ManifestEntryStub()],
      });
    });

    it('EMPTY: {files: [], refused: [], manifest: []} => parses an empty run', () => {
      const result = generationResultContract.parse(
        GenerationResultStub({ files: [], refused: [], manifest: [] }),
      );

      expect(result).toStrictEqual({ files: [], refused: [], manifest: [] });
    });
  });

  describe('invalid results', () => {
    it('INVALID: {files: [{relPath: ""}]} => throws, since each file is checked by its own contract', () => {
      expect(() => {
        return generationResultContract.parse({
          ...GenerationResultStub(),
          files: [{ relPath: '', content: 'x' }],
        });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {refused: [{reason: ""}]} => throws, since each refusal is checked by its own contract', () => {
      expect(() => {
        return generationResultContract.parse({
          ...GenerationResultStub(),
          refused: [{ folder: 'a', reason: '' }],
        });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {manifest: [{verdict: "passed"}]} => throws, since each entry is checked by its own contract', () => {
      expect(() => {
        return generationResultContract.parse({
          ...GenerationResultStub(),
          manifest: [{ ...ManifestEntryStub(), verdict: 'passed' }],
        });
      }).toThrow(/Invalid option: expected one of/u);
    });

    it('INVALID: {files: missing} => throws, since every list is required', () => {
      expect(() => {
        return generationResultContract.parse({ refused: [], manifest: [] });
      }).toThrow(/expected array, received undefined/u);
    });
  });
});
