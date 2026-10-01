import { analyzerHashBroker } from './analyzer-hash-broker';
import { analyzerHashBrokerProxy } from './analyzer-hash-broker.proxy';
import { analyzerHashStatics } from '../../../statics/analyzer-hash/analyzer-hash-statics';
import { harnessModuleStatics } from '../../../statics/harness-module/harness-module-statics';

const SUPPORT_FILES = [
  ...analyzerHashStatics.source.testSupportInfixes.map((infix) => `a-broker${infix}ts`),
  `a${harnessModuleStatics.fileSuffix}`,
];

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

  describe('a source root hashes implementation files only', () => {
    it.each(SUPPORT_FILES)(
      'VALID: {source root, %s edited} => the hash does not change',
      async (supportFile) => {
        const proxy = analyzerHashBrokerProxy();
        proxy.dirHolds({
          path: '/repo/packages/core/src',
          entries: [
            { name: 'a-broker.ts', kind: 'file' },
            { name: supportFile, kind: 'file' },
          ],
        });
        proxy.fileContent({ path: '/repo/packages/core/src/a-broker.ts', content: 'export const a = 1;' });
        proxy.fileContent({ path: `/repo/packages/core/src/${supportFile}`, content: 'export const s = 1;' });
        const before = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });

        proxy.fileContent({ path: `/repo/packages/core/src/${supportFile}`, content: 'export const s = 2;' });
        const after = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });

        expect(after).toBe(before);
      },
    );

    it('VALID: {source root, a stub file added beside the implementation} => identical hash to the implementation alone', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.fileContent({ path: '/repo/packages/core/src/a-broker.ts', content: 'export const a = 1;' });
      proxy.fileContent({ path: '/repo/packages/core/src/a.stub.ts', content: 'export const s = 1;' });
      proxy.dirHolds({
        path: '/repo/packages/core/src',
        entries: [
          { name: 'a-broker.ts', kind: 'file' },
          { name: 'a.stub.ts', kind: 'file' },
        ],
      });
      const withStub = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });

      proxy.dirHolds({ path: '/repo/packages/core/src', entries: [{ name: 'a-broker.ts', kind: 'file' }] });
      const withoutStub = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });

      expect(withStub).toBe(withoutStub);
    });

    it('VALID: {source root, the implementation file edited beside a proxy} => the hash changes', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.dirHolds({
        path: '/repo/packages/core/src',
        entries: [
          { name: 'a-broker.ts', kind: 'file' },
          { name: 'a-broker.proxy.ts', kind: 'file' },
        ],
      });
      proxy.fileContent({ path: '/repo/packages/core/src/a-broker.ts', content: 'export const a = 1;' });
      proxy.fileContent({ path: '/repo/packages/core/src/a-broker.proxy.ts', content: 'export const p = 1;' });
      const before = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });

      proxy.fileContent({ path: '/repo/packages/core/src/a-broker.ts', content: 'export const a = 2;' });
      const after = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });

      expect(new Set([before, after]).size).toBe(2);
    });
  });

  describe('a dist root hashes emitted JavaScript only', () => {
    it('VALID: {dist root, a .js file edited} => the hash changes', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.dirHolds({ path: '/repo/packages/core/dist', entries: [{ name: 'src', kind: 'directory' }] });
      proxy.dirHolds({ path: '/repo/packages/core/dist/src', entries: [{ name: 'a-broker.js', kind: 'file' }] });
      proxy.fileContent({ path: '/repo/packages/core/dist/src/a-broker.js', content: 'exports.a = 1;' });
      const before = await analyzerHashBroker({ roots: ['/repo/packages/core/dist'] });

      proxy.fileContent({ path: '/repo/packages/core/dist/src/a-broker.js', content: 'exports.a = 2;' });
      const after = await analyzerHashBroker({ roots: ['/repo/packages/core/dist'] });

      expect(new Set([before, after]).size).toBe(2);
    });

    it('VALID: {dist root, a .d.ts, a .js.map and a stray .ts beside the .js} => identical hash to the .js alone', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.fileContent({ path: '/repo/packages/core/dist/a-broker.js', content: 'exports.a = 1;' });
      proxy.dirHolds({
        path: '/repo/packages/core/dist',
        entries: [
          { name: 'a-broker.js', kind: 'file' },
          { name: 'a-broker.d.ts', kind: 'file' },
          { name: 'a-broker.js.map', kind: 'file' },
          { name: 'a-broker.ts', kind: 'file' },
        ],
      });
      const withExtras = await analyzerHashBroker({ roots: ['/repo/packages/core/dist'] });

      proxy.dirHolds({ path: '/repo/packages/core/dist', entries: [{ name: 'a-broker.js', kind: 'file' }] });
      const jsAlone = await analyzerHashBroker({ roots: ['/repo/packages/core/dist'] });

      expect(withExtras).toBe(jsAlone);
    });

    it('VALID: {the same .js file under a dist root and under a source root} => only the dist root hashes it', async () => {
      const proxy = analyzerHashBrokerProxy();
      proxy.dirHolds({ path: '/repo/packages/core/dist', entries: [{ name: 'a-broker.js', kind: 'file' }] });
      proxy.dirHolds({ path: '/repo/packages/core/src', entries: [{ name: 'a-broker.js', kind: 'file' }] });
      proxy.dirHolds({ path: '/repo/packages/core/empty', entries: [] });
      proxy.fileContent({ path: '/repo/packages/core/dist/a-broker.js', content: 'exports.a = 1;' });

      const distHash = await analyzerHashBroker({ roots: ['/repo/packages/core/dist'] });
      const sourceHash = await analyzerHashBroker({ roots: ['/repo/packages/core/src'] });
      const emptyHash = await analyzerHashBroker({ roots: ['/repo/packages/core/empty'] });

      expect({ sourceIsEmpty: sourceHash === emptyHash, distIsEmpty: distHash === emptyHash }).toStrictEqual({
        sourceIsEmpty: true,
        distIsEmpty: false,
      });
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
