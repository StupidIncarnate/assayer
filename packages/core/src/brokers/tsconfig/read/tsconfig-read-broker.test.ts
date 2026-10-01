import { tsconfigReadBroker } from './tsconfig-read-broker';
import { tsconfigReadBrokerProxy } from './tsconfig-read-broker.proxy';

// sha256 of the empty string, and of the strict tsconfig text.
const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const STRICT_TEXT = '{ "compilerOptions": { "strict": true, "esModuleInterop": true } }';
const STRICT_HASH = 'ecfe66bf94c2913320308ab1dd9794ba6b34b681f657697c199d4e6e24547983';

describe('tsconfigReadBroker', () => {
  describe('a tsconfig is present above the search path', () => {
    it('VALID: {searchPath with a strict tsconfig} => parsed options, the sha256 of its text, and its path', () => {
      const proxy = tsconfigReadBrokerProxy();
      proxy.tsconfigAt({ searchPath: '/repo/src', configFilePath: '/repo/tsconfig.json', text: STRICT_TEXT });

      const result = tsconfigReadBroker({ searchPath: '/repo/src' });

      expect(result).toStrictEqual({
        options: { strict: true, esModuleInterop: true, configFilePath: undefined },
        tsconfigHash: STRICT_HASH,
        configFilePath: '/repo/tsconfig.json',
      });
    });
  });

  describe('no tsconfig exists above the search path', () => {
    it('EMPTY: {searchPath with no tsconfig anywhere above} => empty options and the empty-content hash', () => {
      const proxy = tsconfigReadBrokerProxy();
      proxy.noTsconfigAt({ searchPath: '/repo' });

      const result = tsconfigReadBroker({ searchPath: '/repo' });

      expect(result).toStrictEqual({ options: {}, tsconfigHash: EMPTY_HASH });
    });
  });
});
