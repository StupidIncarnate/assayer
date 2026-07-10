import { dirEntryContract } from './dir-entry-contract';
import { DirEntryStub } from './dir-entry.stub';

describe('dirEntryContract', () => {
  describe('valid dir entries', () => {
    it('VALID: {name: "src", isDirectory: true} => parses successfully', () => {
      const entry = DirEntryStub({ name: 'src', isDirectory: true });

      const result = dirEntryContract.parse(entry);

      expect(result).toStrictEqual({ name: 'src', isDirectory: true });
    });
  });

  describe('invalid dir entries', () => {
    it('INVALID: {name: "", isDirectory: true} => throws validation error', () => {
      expect(() => {
        return dirEntryContract.parse({ name: '', isDirectory: true });
      }).toThrow(/./u);
    });
  });
});
