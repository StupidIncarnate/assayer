import { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';

import { FsErrorStub } from '#gateway/node/fs/is-fs-error/fs-error.stub';

import { manifestWriteBroker } from './manifest-write-broker';
import { manifestWriteBrokerProxy } from './manifest-write-broker.proxy';

describe('manifestWriteBroker', () => {
  describe('canonical ordering', () => {
    it('VALID: {manifest with two namespaces given unsorted files} => writes manifest.json.tmp with namespaces and files sorted ascending, then renames it to manifest.json', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.succeeds({ configDir: '/repo' });
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          zebra: {
            branch: 'zebra',
            commit: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
            files: [
              {
                relPath: 'src/z.ts',
                contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
              {
                relPath: 'src/a.ts',
                contentHash: 'f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
            ],
          },
          apple: {
            files: [
              {
                relPath: 'src/m.ts',
                contentHash: 'a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
              {
                relPath: 'src/b.ts',
                contentHash: 'b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
            ],
          },
        },
      });

      await manifestWriteBroker({ configDir: '/repo', manifest });

      expect(proxy.getMkdirCalls({ configDir: '/repo' })).toStrictEqual([
        ['/repo/.assayer/cache', { recursive: true }],
      ]);
      expect(proxy.getWriteCalls({ configDir: '/repo' })).toStrictEqual([
        [
          '/repo/.assayer/cache/manifest.json.tmp',
          '{"assayerVersion":"1.0.0","configHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","namespaces":{"apple":{"files":[{"relPath":"src/b.ts","contentHash":"b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/m.ts","contentHash":"a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]},"zebra":{"branch":"zebra","commit":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0","files":[{"relPath":"src/a.ts","contentHash":"f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/z.ts","contentHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]}},"repoName":"assayer","rootFolderName":"smoke-repo"}',
          'utf8',
        ],
      ]);
      expect(proxy.getRenameCalls({ configDir: '/repo' })).toStrictEqual([
        ['/repo/.assayer/cache/manifest.json.tmp', '/repo/.assayer/cache/manifest.json'],
      ]);
    });

    it('EDGE: {namespace with two files sharing the same relPath} => keeps both file entries, comparator treats them as equal', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.succeeds({ configDir: '/repo' });
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          alpha: {
            files: [
              {
                relPath: 'src/dup.ts',
                contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
              {
                relPath: 'src/dup.ts',
                contentHash: 'f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
            ],
          },
        },
      });

      await manifestWriteBroker({ configDir: '/repo', manifest });

      expect(proxy.getWriteCalls({ configDir: '/repo' })).toStrictEqual([
        [
          '/repo/.assayer/cache/manifest.json.tmp',
          '{"assayerVersion":"1.0.0","configHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","namespaces":{"alpha":{"files":[{"relPath":"src/dup.ts","contentHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/dup.ts","contentHash":"f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]}},"repoName":"assayer","rootFolderName":"smoke-repo"}',
          'utf8',
        ],
      ]);
    });
  });

  describe('determinism', () => {
    it('VALID: {same manifest value written twice in two separate calls} => produces byte-identical file contents', async () => {
      const manifest = AssayerCacheManifestStub({
        namespaces: {
          alpha: {
            branch: 'alpha',
            commit: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0',
            files: [
              {
                relPath: 'src/a.ts',
                contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
              {
                relPath: 'src/z.ts',
                contentHash: 'f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
            ],
          },
          zebra: {
            files: [
              {
                relPath: 'src/only.ts',
                contentHash: 'a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
              },
            ],
          },
        },
      });

      // Both calls write the same path, and every proxy mocking writeFile shares one recording of
      // the calls that happened. The first call's content is read before the second call runs, so
      // the second write cannot stand in for it.
      const proxy1 = manifestWriteBrokerProxy();
      proxy1.succeeds({ configDir: '/repo' });
      await manifestWriteBroker({ configDir: '/repo', manifest });
      const expectedWrite = [
        '/repo/.assayer/cache/manifest.json.tmp',
        '{"assayerVersion":"1.0.0","configHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","namespaces":{"alpha":{"branch":"alpha","commit":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0","files":[{"relPath":"src/a.ts","contentHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/z.ts","contentHash":"f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]},"zebra":{"files":[{"relPath":"src/only.ts","contentHash":"a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]}},"repoName":"assayer","rootFolderName":"smoke-repo"}',
        'utf8',
      ];

      expect(proxy1.getWriteCalls({ configDir: '/repo' })).toStrictEqual([expectedWrite]);

      const proxy2 = manifestWriteBrokerProxy();
      proxy2.succeeds({ configDir: '/repo' });
      await manifestWriteBroker({ configDir: '/repo', manifest });

      expect(proxy2.getWriteCalls({ configDir: '/repo' })).toStrictEqual([
        expectedWrite,
        expectedWrite,
      ]);
    });
  });

  describe('a failure along the mkdir -> write -> rename sequence', () => {
    it('ERROR: {cache dir cannot be created} => propagates the mkdir rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.mkdirThrows({
        configDir: '/repo',
        error: FsErrorStub({ code: 'EACCES', path: '/repo/.assayer/cache', syscall: 'mkdir' }),
      });

      await expect(
        manifestWriteBroker({ configDir: '/repo', manifest: AssayerCacheManifestStub() }),
      ).rejects.toThrow(/^EACCES: mkdir '\/repo\/\.assayer\/cache'$/u);
    });

    it('ERROR: {tmp manifest cannot be written} => propagates the write rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.writeThrows({
        configDir: '/repo',
        error: FsErrorStub({
          code: 'ENOSPC',
          path: '/repo/.assayer/cache/manifest.json.tmp',
          syscall: 'write',
        }),
      });

      await expect(
        manifestWriteBroker({ configDir: '/repo', manifest: AssayerCacheManifestStub() }),
      ).rejects.toThrow(/^ENOSPC: write '\/repo\/\.assayer\/cache\/manifest\.json\.tmp'$/u);
    });

    it('ERROR: {tmp manifest cannot be renamed into place} => propagates the rename rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.renameThrows({
        configDir: '/repo',
        error: FsErrorStub({
          code: 'ENOENT',
          path: '/repo/.assayer/cache/manifest.json.tmp',
          syscall: 'rename',
        }),
      });

      await expect(
        manifestWriteBroker({ configDir: '/repo', manifest: AssayerCacheManifestStub() }),
      ).rejects.toThrow(/^ENOENT: rename '\/repo\/\.assayer\/cache\/manifest\.json\.tmp'$/u);
    });
  });
});
