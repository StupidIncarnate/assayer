import { nodeFsCacheManifestExistsAdapter } from './node-fs-cache-manifest-exists-adapter';
import { nodeFsCacheManifestExistsAdapterProxy } from './node-fs-cache-manifest-exists-adapter.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('nodeFsCacheManifestExistsAdapter', () => {
  describe('manifest present', () => {
    it('VALID: {repoPath with a readable manifest} => returns true and checks the derived cache path', async () => {
      const proxy = nodeFsCacheManifestExistsAdapterProxy();

      proxy.exists();

      const result = await nodeFsCacheManifestExistsAdapter({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(result).toBe(true);
      expect(proxy.checkedPath()).toBe('/repo/.assayer/cache/manifest.json');
    });
  });

  describe('manifest missing', () => {
    it('EMPTY: {repoPath with no manifest on disk} => returns false without throwing', async () => {
      const proxy = nodeFsCacheManifestExistsAdapterProxy();

      proxy.missing();

      const result = await nodeFsCacheManifestExistsAdapter({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(result).toBe(false);
    });
  });
});
