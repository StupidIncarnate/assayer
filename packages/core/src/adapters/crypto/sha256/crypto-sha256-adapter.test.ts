import { cryptoSha256Adapter } from './crypto-sha256-adapter';
import { cryptoSha256AdapterProxy } from './crypto-sha256-adapter.proxy';

describe('cryptoSha256Adapter', () => {
  describe('hashing content', () => {
    it('VALID: {content: "abc"} => both calls return the same known sha256 digest', () => {
      cryptoSha256AdapterProxy();

      const a = cryptoSha256Adapter({ content: 'abc' });
      const b = cryptoSha256Adapter({ content: 'abc' });

      expect(a).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
      expect(b).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('EMPTY: {content: ""} => returns the known sha256 digest of the empty string', () => {
      cryptoSha256AdapterProxy();

      const result = cryptoSha256Adapter({ content: '' });

      expect(result).toBe('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    });
  });
});
