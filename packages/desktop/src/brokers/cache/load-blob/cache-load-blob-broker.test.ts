import { cacheLoadBlobBroker } from './cache-load-blob-broker';
import { cacheLoadBlobBrokerProxy } from './cache-load-blob-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';
import { CompiledFileBlobStub } from '@assayer/shared/contracts';

describe('cacheLoadBlobBroker', () => {
  describe('successful load', () => {
    it('VALID: {repoPath, contentHash} => returns the validated blob', async () => {
      const proxy = cacheLoadBlobBrokerProxy();
      const blob = CompiledFileBlobStub();
      proxy.resolves({ blob });

      const result = await cacheLoadBlobBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        contentHash: 'abc123',
      });

      expect(result).toStrictEqual(blob);
    });
  });

  describe('read failure', () => {
    it('ERROR: {adapter read rejects} => rejects with the underlying error', async () => {
      const proxy = cacheLoadBlobBrokerProxy();
      proxy.rejects({ error: new Error('ENOENT') });

      await expect(
        cacheLoadBlobBroker({
          repoPath: RepoPathStub({ value: '/repo' }),
          contentHash: 'abc123',
        }),
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
