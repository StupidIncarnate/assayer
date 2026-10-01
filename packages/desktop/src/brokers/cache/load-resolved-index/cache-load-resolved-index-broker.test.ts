import { ResolvedIndexStub } from '@assayer/shared/contracts/resolved-index/resolved-index.stub';

import { cacheLoadResolvedIndexBroker } from './cache-load-resolved-index-broker';
import { cacheLoadResolvedIndexBrokerProxy } from './cache-load-resolved-index-broker.proxy';

describe('cacheLoadResolvedIndexBroker', () => {
  describe('present index', () => {
    it('VALID: {resolved index on disk} => returns the validated ResolvedIndex', async () => {
      const index = ResolvedIndexStub();
      const proxy = cacheLoadResolvedIndexBrokerProxy();
      proxy.resolves({ repoPath: '/repo', namespace: 'main', index });

      const result = await cacheLoadResolvedIndexBroker({
        repoPath: '/repo',
        namespace: 'main',
      });

      expect(result).toStrictEqual(index);
    });
  });

  describe('absent index', () => {
    it('EMPTY: {no resolved index for the namespace} => returns undefined', async () => {
      const proxy = cacheLoadResolvedIndexBrokerProxy();
      proxy.absent({ repoPath: '/repo', namespace: 'main' });

      const result = await cacheLoadResolvedIndexBroker({
        repoPath: '/repo',
        namespace: 'main',
      });

      expect(result).toBe(undefined);
    });
  });
});
