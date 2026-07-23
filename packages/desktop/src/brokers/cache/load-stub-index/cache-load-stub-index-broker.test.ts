import { NamespaceNameStub, StubIndexStub } from '@assayer/shared/contracts';

import { cacheLoadStubIndexBroker } from './cache-load-stub-index-broker';
import { cacheLoadStubIndexBrokerProxy } from './cache-load-stub-index-broker.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('cacheLoadStubIndexBroker', () => {
  describe('present index', () => {
    it('VALID: {stub index on disk} => returns the validated StubIndex', async () => {
      const index = StubIndexStub();
      const proxy = cacheLoadStubIndexBrokerProxy();
      proxy.resolves({ index });

      const result = await cacheLoadStubIndexBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toStrictEqual(index);
    });
  });

  describe('absent index', () => {
    it('EMPTY: {no stub index for the namespace} => returns undefined', async () => {
      const proxy = cacheLoadStubIndexBrokerProxy();
      proxy.absent();

      const result = await cacheLoadStubIndexBroker({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
