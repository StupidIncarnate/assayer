import { AssayerCacheManifestStub } from '@assayer/shared/contracts/assayer-cache-manifest/assayer-cache-manifest.stub';

import { cacheLoadManifestBroker } from './cache-load-manifest-broker';
import { cacheLoadManifestBrokerProxy } from './cache-load-manifest-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('cacheLoadManifestBroker', () => {
  describe('successful load', () => {
    it('VALID: {repoPath} => returns the parsed cache manifest', async () => {
      const proxy = cacheLoadManifestBrokerProxy();
      const manifest = AssayerCacheManifestStub();

      proxy.resolves({ repoPath: '/repo', manifest });

      const result = await cacheLoadManifestBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(result).toStrictEqual(manifest);
    });
  });

  describe('error cases', () => {
    it('ERROR: {manifest file missing} => rejects with the underlying error', async () => {
      const proxy = cacheLoadManifestBrokerProxy();

      proxy.missing({ repoPath: '/repo' });

      await expect(
        cacheLoadManifestBroker({ repoPath: RepoPathStub({ value: '/repo' }) }),
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
