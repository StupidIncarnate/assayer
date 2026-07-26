import { AssayerCacheManifestStub } from '@assayer/shared/contracts';

import { manifestWriteBroker } from './manifest-write-broker';
import { manifestWriteBrokerProxy } from './manifest-write-broker.proxy';

describe('manifestWriteBroker', () => {
  describe('canonical ordering', () => {
    it('VALID: {manifest with two namespaces given unsorted files} => writes manifest.json.tmp with namespaces and files sorted ascending, then renames it to manifest.json', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.succeeds();
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

      const result = await manifestWriteBroker({ configDir: '/repo', manifest });

      expect(result).toStrictEqual({ success: true });
      expect(proxy.getWrittenPaths()).toStrictEqual(['/repo/.assayer/cache/manifest.json.tmp']);
      expect(
        proxy.getWrittenContentFor({ path: '/repo/.assayer/cache/manifest.json.tmp' }),
      ).toBe(
        '{"assayerVersion":"1.0.0","configHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","namespaces":{"apple":{"files":[{"relPath":"src/b.ts","contentHash":"b3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/m.ts","contentHash":"a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]},"zebra":{"branch":"zebra","commit":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0","files":[{"relPath":"src/a.ts","contentHash":"f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/z.ts","contentHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]}},"repoName":"assayer","rootFolderName":"smoke-repo"}',
      );
      expect(
        proxy.getRenameArgs({ from: '/repo/.assayer/cache/manifest.json.tmp' }),
      ).toStrictEqual([
        '/repo/.assayer/cache/manifest.json.tmp',
        '/repo/.assayer/cache/manifest.json',
      ]);
    });

    it('EDGE: {namespace with two files sharing the same relPath} => keeps both file entries, comparator treats them as equal', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.succeeds();
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

      const result = await manifestWriteBroker({ configDir: '/repo', manifest });

      expect(result).toStrictEqual({ success: true });
      expect(
        proxy.getWrittenContentFor({ path: '/repo/.assayer/cache/manifest.json.tmp' }),
      ).toBe(
        '{"assayerVersion":"1.0.0","configHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","namespaces":{"alpha":{"files":[{"relPath":"src/dup.ts","contentHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/dup.ts","contentHash":"f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]}},"repoName":"assayer","rootFolderName":"smoke-repo"}',
      );
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
      // the calls that happened. So each content must be read while its own call is the latest one
      // to that path. Reading content1 after the second call would answer with the second write,
      // and the comparison below would then compare that write against itself.
      const proxy1 = manifestWriteBrokerProxy();
      proxy1.succeeds();
      await manifestWriteBroker({ configDir: '/repo', manifest });
      const content1 = proxy1.getWrittenContentFor({
        path: '/repo/.assayer/cache/manifest.json.tmp',
      });

      expect(content1).toBe(
        '{"assayerVersion":"1.0.0","configHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855","namespaces":{"alpha":{"branch":"alpha","commit":"a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0","files":[{"relPath":"src/a.ts","contentHash":"e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"},{"relPath":"src/z.ts","contentHash":"f3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]},"zebra":{"files":[{"relPath":"src/only.ts","contentHash":"a3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}]}},"repoName":"assayer","rootFolderName":"smoke-repo"}',
      );

      const proxy2 = manifestWriteBrokerProxy();
      proxy2.succeeds();
      await manifestWriteBroker({ configDir: '/repo', manifest });
      const content2 = proxy2.getWrittenContentFor({
        path: '/repo/.assayer/cache/manifest.json.tmp',
      });

      expect(content2).toBe(content1);
    });
  });

  describe('a failure along the mkdir -> write -> rename sequence', () => {
    it('ERROR: {cache dir cannot be created} => propagates the mkdir rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.mkdirThrows({ error: new Error('EACCES: permission denied') });

      await expect(
        manifestWriteBroker({ configDir: '/repo', manifest: AssayerCacheManifestStub() }),
      ).rejects.toThrow(/^EACCES: permission denied$/u);
    });

    it('ERROR: {tmp manifest cannot be written} => propagates the write rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.writeThrows({ error: new Error('ENOSPC: no space left on device') });

      await expect(
        manifestWriteBroker({ configDir: '/repo', manifest: AssayerCacheManifestStub() }),
      ).rejects.toThrow(/^ENOSPC: no space left on device$/u);
    });

    it('ERROR: {tmp manifest cannot be renamed into place} => propagates the rename rejection unmodified, since it is never wrapped in try/catch', async () => {
      const proxy = manifestWriteBrokerProxy();
      proxy.renameThrows({ error: new Error('ENOENT: no such file or directory') });

      await expect(
        manifestWriteBroker({ configDir: '/repo', manifest: AssayerCacheManifestStub() }),
      ).rejects.toThrow(/^ENOENT: no such file or directory$/u);
    });
  });
});
