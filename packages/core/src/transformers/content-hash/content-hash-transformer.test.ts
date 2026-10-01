import { contentHashTransformer } from './content-hash-transformer';
import { contentHashTransformerProxy } from './content-hash-transformer.proxy';

describe('contentHashTransformer', () => {
  describe('hashing content', () => {
    it('VALID: {content: "abc"} => both calls return the same known sha256 digest', () => {
      contentHashTransformerProxy();

      const a = contentHashTransformer({ content: 'abc' });
      const b = contentHashTransformer({ content: 'abc' });

      expect(a).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      expect(b).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('EMPTY: {content: ""} => returns the known sha256 digest of the empty string', () => {
      contentHashTransformerProxy();

      const result = contentHashTransformer({ content: '' });

      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });
});
