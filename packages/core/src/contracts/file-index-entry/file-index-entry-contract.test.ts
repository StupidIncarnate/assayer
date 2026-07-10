import { fileIndexEntryContract } from './file-index-entry-contract';
import { FileIndexEntryStub } from './file-index-entry.stub';

describe('fileIndexEntryContract', () => {
  describe('valid file index entries', () => {
    it('VALID: {relPath: "a.ts"} => parses successfully', () => {
      const entry = FileIndexEntryStub({ relPath: 'a.ts' });

      const result = fileIndexEntryContract.parse(entry);

      expect(result).toStrictEqual({ relPath: 'a.ts' });
    });
  });

  describe('invalid file index entries', () => {
    it('INVALID: {relPath: ""} => throws validation error', () => {
      expect(() => {
        return fileIndexEntryContract.parse({ relPath: '' });
      }).toThrow(/./u);
    });
  });
});
