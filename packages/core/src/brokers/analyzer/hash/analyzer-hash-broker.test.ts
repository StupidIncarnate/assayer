import { analyzerHashBroker } from './analyzer-hash-broker';
import { analyzerHashBrokerProxy } from './analyzer-hash-broker.proxy';

describe('analyzerHashBroker', () => {
  describe('determinism', () => {
    it('VALID: {same files + content} => identical hash across runs', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.dirHolds({
        path: '/root',
        entries: [
          { name: 'a.ts', kind: 'file' },
          { name: 'sub', kind: 'directory' },
        ],
      });
      proxy.dirHolds({ path: '/root/sub', entries: [{ name: 'b.ts', kind: 'file' }] });
      proxy.fileContent({ path: '/root/a.ts', content: 'export const a = 1;' });
      proxy.fileContent({ path: '/root/sub/b.ts', content: 'export const a = 1;' });

      const first = await analyzerHashBroker({ roots: ['/root'] });
      const second = await analyzerHashBroker({ roots: ['/root'] });

      expect(first).toBe(second);
    });
  });

  describe('sensitivity to source content', () => {
    it('VALID: {a source file changes} => the hash changes', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.dirHolds({ path: '/root', entries: [{ name: 'a.ts', kind: 'file' }] });
      proxy.fileContent({ path: '/root/a.ts', content: 'export const a = 1;' });
      const before = await analyzerHashBroker({ roots: ['/root'] });

      proxy.fileContent({ path: '/root/a.ts', content: 'export const a = 2;' });
      const after = await analyzerHashBroker({ roots: ['/root'] });

      expect(new Set([before, after]).size).toBe(2);
    });
  });

  describe('test files are excluded', () => {
    it('VALID: {a .test.ts present alongside a.ts} => identical hash to a.ts alone', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.fileContent({ path: '/root/a.ts', content: 'x' });

      proxy.dirHolds({
        path: '/root',
        entries: [
          { name: 'a.ts', kind: 'file' },
          { name: 'a.test.ts', kind: 'file' },
        ],
      });
      const withTest = await analyzerHashBroker({ roots: ['/root'] });

      proxy.dirHolds({ path: '/root', entries: [{ name: 'a.ts', kind: 'file' }] });
      const withoutTest = await analyzerHashBroker({ roots: ['/root'] });

      expect(withTest).toBe(withoutTest);
    });
  });

  describe('a source file that cannot be read from disk', () => {
    it("ERROR: {roots: one file, reading it rejects with EACCES} => propagates the filesystem error unmodified, since the read is never wrapped in try/catch", async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.dirHolds({ path: '/root', entries: [{ name: 'a.ts', kind: 'file' }] });
      proxy.readDenied({ path: '/root/a.ts' });

      await expect(analyzerHashBroker({ roots: ['/root'] })).rejects.toThrow(/^EACCES: op '\/root\/a\.ts'$/u);
    });
  });
});
