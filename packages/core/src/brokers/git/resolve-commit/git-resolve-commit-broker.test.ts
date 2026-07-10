import { gitResolveCommitBroker } from './git-resolve-commit-broker';
import { gitResolveCommitBrokerProxy } from './git-resolve-commit-broker.proxy';

describe('gitResolveCommitBroker', () => {
  describe('ref resolves to a commit', () => {
    it('VALID: {repoRoot: "/repo", ref: "master"} => returns the resolved 40-char commit sha', async () => {
      const proxy = gitResolveCommitBrokerProxy();

      proxy.resolvesTo({ sha: '9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2' });

      const result = await gitResolveCommitBroker({ repoRoot: '/repo', ref: 'master' });

      expect(result).toBe('9fceb02f1a3e4c98d9c8b1e6f2a7d5c3b0e1f4a2');
    });
  });

  describe('ref does not exist', () => {
    it('EMPTY: {repoRoot: "/repo", ref: "does-not-exist"} => returns undefined', async () => {
      const proxy = gitResolveCommitBrokerProxy();

      proxy.refMissing();

      const result = await gitResolveCommitBroker({ repoRoot: '/repo', ref: 'does-not-exist' });
      const notResolved: typeof result = undefined;

      expect(result).toBe(notResolved);
    });
  });
});
