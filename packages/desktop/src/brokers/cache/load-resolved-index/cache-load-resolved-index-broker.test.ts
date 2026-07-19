import { NamespaceNameStub, ResolvedIndexStub } from '@assayer/shared/contracts';

import { cacheLoadResolvedIndexBroker } from './cache-load-resolved-index-broker';
import { cacheLoadResolvedIndexBrokerProxy } from './cache-load-resolved-index-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('cacheLoadResolvedIndexBroker', () => {
  describe('present index', () => {
    it('VALID: {resolved index on disk} => returns the validated ResolvedIndex', async () => {
      const index = ResolvedIndexStub();
      const proxy = cacheLoadResolvedIndexBrokerProxy();
      proxy.resolves({ index });

      const result = await cacheLoadResolvedIndexBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toStrictEqual(index);
    });
  });

  describe('absent index', () => {
    it('EMPTY: {no resolved index for the namespace} => returns undefined', async () => {
      const proxy = cacheLoadResolvedIndexBrokerProxy();
      proxy.absent();

      const result = await cacheLoadResolvedIndexBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
