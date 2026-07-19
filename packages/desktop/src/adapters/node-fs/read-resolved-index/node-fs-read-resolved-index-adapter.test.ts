import { NamespaceNameStub } from '@assayer/shared/contracts';

import { nodeFsReadResolvedIndexAdapter } from './node-fs-read-resolved-index-adapter';
import { nodeFsReadResolvedIndexAdapterProxy } from './node-fs-read-resolved-index-adapter.proxy';
import { RepoPathStub } from '../../../contracts/repo-path/repo-path.stub';

describe('nodeFsReadResolvedIndexAdapter', () => {
  describe('successful read', () => {
    it('VALID: {repoPath: "/repo", namespace: "main"} => reads exact resolved path and returns parsed JSON', async () => {
      const proxy = nodeFsReadResolvedIndexAdapterProxy();

      proxy.returns({ content: '{"edges":[]}' });

      const result = await nodeFsReadResolvedIndexAdapter({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toStrictEqual({ edges: [] });
      expect(proxy.readPath()).toBe('/repo/.assayer/cache/resolved/main.json');
    });
  });

  describe('absent index', () => {
    it('EMPTY: {resolved index file does not exist} => returns undefined without reading', async () => {
      const proxy = nodeFsReadResolvedIndexAdapterProxy();

      proxy.absent();

      const result = await nodeFsReadResolvedIndexAdapter({
        repoPath: RepoPathStub({ value: '/repo' }),
        namespace: NamespaceNameStub({ value: 'main' }),
      });

      expect(result).toBe(undefined);
    });
  });
});
