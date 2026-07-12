import { AssayerCacheManifestStub } from '@assayer/shared/contracts';

import { cacheLoadManifestBroker } from './cache-load-manifest-broker';
import { cacheLoadManifestBrokerProxy } from './cache-load-manifest-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('cacheLoadManifestBroker', () => {
  describe('successful load', () => {
    it('VALID: {repoPath} => returns the parsed cache manifest', async () => {
      const proxy = cacheLoadManifestBrokerProxy();
      const manifest = AssayerCacheManifestStub();

      proxy.resolves({ manifest });

      const result = await cacheLoadManifestBroker({ repoPath: RepoPathStub({ value: '/repo' }) });

      expect(result).toStrictEqual(manifest);
    });
  });

  describe('error cases', () => {
    it('ERROR: {adapter read rejects} => rejects with the underlying error', async () => {
      const proxy = cacheLoadManifestBrokerProxy();

      proxy.rejects({ error: new Error('ENOENT') });

      await expect(
        cacheLoadManifestBroker({ repoPath: RepoPathStub({ value: '/repo' }) }),
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
