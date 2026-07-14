import { analyzerHashBroker } from './analyzer-hash-broker';
import { analyzerHashBrokerProxy } from './analyzer-hash-broker.proxy';

describe('analyzerHashBroker', () => {
  describe('determinism', () => {
    it('VALID: {same files + content} => identical hash across runs', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.walkReturns({ paths: ['/root/a.ts', '/root/sub/b.ts'] });
      proxy.fileContent({ content: 'export const a = 1;' });

      const first = await analyzerHashBroker({ roots: ['/root'] });
      const second = await analyzerHashBroker({ roots: ['/root'] });

      expect(first).toBe(second);
    });
  });

  describe('sensitivity to source content', () => {
    it('VALID: {a source file changes} => the hash changes', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.walkReturns({ paths: ['/root/a.ts'] });
      proxy.fileContent({ content: 'export const a = 1;' });
      const before = await analyzerHashBroker({ roots: ['/root'] });

      proxy.fileContent({ content: 'export const a = 2;' });
      const after = await analyzerHashBroker({ roots: ['/root'] });

      expect(new Set([before, after]).size).toBe(2);
    });
  });

  describe('test files are excluded', () => {
    it('VALID: {a .test.ts present alongside a.ts} => identical hash to a.ts alone', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.fileContent({ content: 'x' });

      proxy.walkReturns({ paths: ['/root/a.ts', '/root/a.test.ts'] });
      const withTest = await analyzerHashBroker({ roots: ['/root'] });

      proxy.walkReturns({ paths: ['/root/a.ts'] });
      const withoutTest = await analyzerHashBroker({ roots: ['/root'] });

      expect(withTest).toBe(withoutTest);
    });
  });
});
