import { generatedFileContract } from './generated-file-contract';
import { GeneratedFileStub } from './generated-file.stub';

describe('generatedFileContract', () => {
  describe('valid files', () => {
    it('VALID: {stub default} => parses a relative path and its content', () => {
      const file = GeneratedFileStub();

      const result = generatedFileContract.parse(file);

      expect(result).toStrictEqual({
        relPath: 'packages/syntax-repository/specimen-manifest.json',
        content: '[]',
      });
    });

    it('EMPTY: {content: ""} => parses, since an empty file is still a file', () => {
      const file = GeneratedFileStub({ content: '' as never });

      const result = generatedFileContract.parse(file);

      expect(result).toStrictEqual({
        relPath: 'packages/syntax-repository/specimen-manifest.json',
        content: '',
      });
    });
  });

  describe('invalid files', () => {
    it('INVALID: {relPath: ""} => throws, since a file needs a path', () => {
      expect(() => {
        return generatedFileContract.parse({ ...GeneratedFileStub(), relPath: '' });
      }).toThrow(/Too small: expected string to have >=1 characters/u);
    });

    it('INVALID: {content: missing} => throws, since a file needs content', () => {
      expect(() => {
        return generatedFileContract.parse({ relPath: 'a.ts' });
      }).toThrow(/expected string, received undefined/u);
    });
  });
});
