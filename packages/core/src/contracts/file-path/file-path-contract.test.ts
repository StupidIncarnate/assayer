import { filePathContract } from './file-path-contract';
import { FilePathStub } from './file-path.stub';

describe('filePathContract', () => {
  describe('valid file paths', () => {
    it('VALID: {value: "/repo"} => parses successfully', () => {
      const result = filePathContract.parse('/repo');

      expect(result).toBe('/repo');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const path = FilePathStub();

      const result = filePathContract.parse(path);

      expect(result).toBe('/repo/src/index.ts');
    });
  });

  describe('invalid file paths', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return filePathContract.parse('');
      }).toThrow(/./u);
    });
  });
});
