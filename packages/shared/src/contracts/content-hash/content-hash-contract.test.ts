import { contentHashContract } from './content-hash-contract';
import { ContentHashStub } from './content-hash.stub';

describe('contentHashContract', () => {
  describe('valid hashes', () => {
    it('VALID: {value: "e3b0c...b855"} => parses successfully', () => {
      const result = contentHashContract.parse(
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      );

      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });

    it('VALID: {value: stub default} => parses successfully', () => {
      const hash = ContentHashStub();

      const result = contentHashContract.parse(hash);

      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });

  describe('invalid hashes', () => {
    it('INVALID: {value: "not-a-hash"} => throws validation error', () => {
      expect(() => {
        return contentHashContract.parse('not-a-hash');
      }).toThrow(/Invalid/u);
    });
  });
});
