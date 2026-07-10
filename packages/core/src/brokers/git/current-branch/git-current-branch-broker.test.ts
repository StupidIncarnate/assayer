import { gitCurrentBranchBroker } from './git-current-branch-broker';
import { gitCurrentBranchBrokerProxy } from './git-current-branch-broker.proxy';

describe('gitCurrentBranchBroker', () => {
  describe('on a named branch', () => {
    it('VALID: {repoRoot: "/repo"} on branch "feature-x" => returns "feature-x"', async () => {
      const proxy = gitCurrentBranchBrokerProxy();
      proxy.onBranch({ name: 'feature-x' });

      const result = await gitCurrentBranchBroker({ repoRoot: '/repo' });

      expect(result).toBe('feature-x');
    });
  });

  describe('detached HEAD', () => {
    it('EDGE: {repoRoot: "/repo"} detached HEAD at short sha "abc1234" => returns "detached-abc1234"', async () => {
      const proxy = gitCurrentBranchBrokerProxy();
      proxy.detachedAt({ shortSha: 'abc1234' });

      const result = await gitCurrentBranchBroker({ repoRoot: '/repo' });

      expect(result).toBe('detached-abc1234');
    });
  });

  describe('not a git repository', () => {
    it('EMPTY: {repoRoot: "/repo"} not a git repository => returns "default"', async () => {
      const proxy = gitCurrentBranchBrokerProxy();
      proxy.notGitRepo();

      const result = await gitCurrentBranchBroker({ repoRoot: '/repo' });

      expect(result).toBe('default');
    });
  });
});
