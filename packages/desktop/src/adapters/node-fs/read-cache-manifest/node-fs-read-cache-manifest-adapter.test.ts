import { nodeFsReadCacheManifestAdapter } from './node-fs-read-cache-manifest-adapter';
import { nodeFsReadCacheManifestAdapterProxy } from './node-fs-read-cache-manifest-adapter.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('nodeFsReadCacheManifestAdapter', () => {
  describe('successful read', () => {
    it('VALID: {repoPath: "/repo"} => reads manifest.json at the derived cache path and returns parsed JSON', async () => {
      const proxy = nodeFsReadCacheManifestAdapterProxy();

      proxy.returns({ content: '{"a":1}' });

      const result = await nodeFsReadCacheManifestAdapter({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(result).toStrictEqual({ a: 1 });
      expect(proxy.readPath()).toBe('/repo/.assayer/cache/manifest.json');
    });
  });

  describe('error cases', () => {
    it('ERROR: {repoPath: missing manifest} => underlying fs error propagates unmodified', async () => {
      const proxy = nodeFsReadCacheManifestAdapterProxy();

      proxy.throws({ error: new Error('ENOENT: no such file') });

      await expect(
        nodeFsReadCacheManifestAdapter({ repoPath: RepoPathStub({ value: '/repo' }) })
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
