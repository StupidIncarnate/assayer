import { cacheLoadBlobBroker } from './cache-load-blob-broker';
import { cacheLoadBlobBrokerProxy } from './cache-load-blob-broker.proxy';
import { CompiledFileBlobStub } from '@assayer/shared/contracts/compiled-file-blob/compiled-file-blob.stub';

describe('cacheLoadBlobBroker', () => {
  describe('successful load', () => {
    it('VALID: {repoPath, analysisHash} => returns the validated blob', async () => {
      const proxy = cacheLoadBlobBrokerProxy();
      const blob = CompiledFileBlobStub();
      proxy.resolves({ repoPath: '/repo', analysisHash: 'abc123', blob });

      const result = await cacheLoadBlobBroker({
        repoPath: '/repo',
        analysisHash: 'abc123',
      });

      expect(result).toStrictEqual(blob);
    });
  });

  describe('read failure', () => {
    it('ERROR: {blob file missing} => rejects with the underlying error', async () => {
      const proxy = cacheLoadBlobBrokerProxy();
      proxy.missing({ repoPath: '/repo', analysisHash: 'abc123' });

      await expect(
        cacheLoadBlobBroker({
          repoPath: '/repo',
          analysisHash: 'abc123',
        }),
      ).rejects.toThrow(/ENOENT/u);
    });
  });
});
