import { folderNameContract } from './folder-name-contract';
import { FolderNameStub } from './folder-name.stub';

describe('folderNameContract', () => {
  describe('valid folder names', () => {
    it('VALID: {value: "smoke-repo"} => parses successfully', () => {
      const name = FolderNameStub({ value: 'smoke-repo' });

      const result = folderNameContract.parse(name);

      expect(result).toBe('smoke-repo');
    });
  });

  describe('invalid folder names', () => {
    it('INVALID: {value: ""} => throws validation error', () => {
      expect(() => {
        return folderNameContract.parse('');
      }).toThrow(/at least 1 character/u);
    });
  });
});
