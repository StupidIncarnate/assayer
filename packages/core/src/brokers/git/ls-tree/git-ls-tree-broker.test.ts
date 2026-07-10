import { gitLsTreeBroker } from './git-ls-tree-broker';
import { gitLsTreeBrokerProxy } from './git-ls-tree-broker.proxy';

describe('gitLsTreeBroker', () => {
  describe('tree with tracked files', () => {
    it('VALID: {repoRoot: "/repo", ref: "HEAD"} => returns each entry\'s relPath and blob sha', async () => {
      const proxy = gitLsTreeBrokerProxy();

      proxy.returnsTree({
        stdout:
          '100644 blob e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\tpackages/shared/index.ts\n' +
          '100644 blob a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2\tpackages/web/app.tsx\n',
      });

      const result = await gitLsTreeBroker({ repoRoot: '/repo', ref: 'HEAD' });

      expect(result).toStrictEqual([
        {
          relPath: 'packages/shared/index.ts',
          blobSha: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        },
        {
          relPath: 'packages/web/app.tsx',
          blobSha: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
        },
      ]);
    });
  });

  describe('tree with no tracked files', () => {
    it('EMPTY: {repoRoot: "/repo", ref: "HEAD"} => returns an empty array', async () => {
      const proxy = gitLsTreeBrokerProxy();

      proxy.returnsTree({ stdout: '' });

      const result = await gitLsTreeBroker({ repoRoot: '/repo', ref: 'HEAD' });

      expect(result).toStrictEqual([]);
    });
  });
});
