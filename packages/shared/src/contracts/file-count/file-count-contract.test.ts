import { fileCountContract } from './file-count-contract';
import { FileCountStub } from './file-count.stub';

describe('fileCountContract', () => {
  describe('valid file counts', () => {
    it('VALID: {value: 0} => parses successfully', () => {
      const result = fileCountContract.parse(0);

      expect(result).toBe(0);
    });

    it('VALID: {value: 42} => parses successfully', () => {
      const result = fileCountContract.parse(42);

      expect(result).toBe(42);
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const count = FileCountStub();

      const result = fileCountContract.parse(count);

      expect(result).toBe(0);
    });
  });

  describe('invalid file counts', () => {
    it('INVALID: {value: -1} => throws validation error', () => {
      expect(() => {
        return fileCountContract.parse(-1);
      }).toThrow(/greater than or equal to 0/u);
    });
  });
});
