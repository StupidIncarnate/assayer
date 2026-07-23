import { NamespaceNameStub } from '@assayer/shared/contracts';

import { nodeFsReadStubIndexAdapter } from './node-fs-read-stub-index-adapter';
import { nodeFsReadStubIndexAdapterProxy } from './node-fs-read-stub-index-adapter.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('nodeFsReadStubIndexAdapter', () => {
  describe('successful read', () => {
    it('VALID: {repoPath: "/repo", namespace: "main"} => reads exact stubs path and returns parsed JSON', async () => {
      const proxy = nodeFsReadStubIndexAdapterProxy();

      proxy.returns({ content: '{"objectStubs":[],"envStubs":[]}' });

      const result = await nodeFsReadStubIndexAdapter({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toStrictEqual({ objectStubs: [], envStubs: [] });
      expect(proxy.readPath()).toBe('/repo/.assayer/cache/stubs/main.json');
    });
  });

  describe('absent index', () => {
    it('EMPTY: {stub index file does not exist} => returns undefined without reading', async () => {
      const proxy = nodeFsReadStubIndexAdapterProxy();

      proxy.absent();

      const result = await nodeFsReadStubIndexAdapter({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
