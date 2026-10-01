import { NamespaceNameStub } from '@assayer/shared/contracts/namespace-name/namespace-name.stub';
import { StubIndexStub } from '@assayer/shared/contracts/stub-index/stub-index.stub';

import { cacheLoadStubIndexBroker } from './cache-load-stub-index-broker';
import { cacheLoadStubIndexBrokerProxy } from './cache-load-stub-index-broker.proxy';

describe('cacheLoadStubIndexBroker', () => {
  describe('present index', () => {
    it('VALID: {stub index on disk} => returns the validated StubIndex', async () => {
      const index = StubIndexStub();
      const proxy = cacheLoadStubIndexBrokerProxy();
      proxy.resolves({ repoPath: '/repo', namespace: 'main', index });

      const result = await cacheLoadStubIndexBroker({
        repoPath: '/repo',
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toStrictEqual(index);
    });
  });

  describe('absent index', () => {
    it('EMPTY: {no stub index for the namespace} => returns undefined', async () => {
      const proxy = cacheLoadStubIndexBrokerProxy();
      proxy.absent({ repoPath: '/repo', namespace: 'main' });

      const result = await cacheLoadStubIndexBroker({
        repoPath: '/repo',
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
