import { GitNotInstalledError } from '#gateway/bin/git';

import { gitDetectStableBranchBroker } from './git-detect-stable-branch-broker';
import { gitDetectStableBranchBrokerProxy } from './git-detect-stable-branch-broker.proxy';

describe('gitDetectStableBranchBroker', () => {
  describe('not inside a git working tree', () => {
    it('EMPTY: {repoRoot: "/repo"} not inside any git working tree => returns { hasGitRepo: false }', async () => {
      const proxy = gitDetectStableBranchBrokerProxy();
      proxy.notGitRepo();

      const result = await gitDetectStableBranchBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual({ hasGitRepo: false });
    });
  });

  describe('git is not installed', () => {
    it('ERROR: {repoRoot: "/repo"} git binary missing => rejects with GitNotInstalledError naming the git call', async () => {
      const proxy = gitDetectStableBranchBrokerProxy();
      proxy.gitNotInstalled();

      await expect(gitDetectStableBranchBroker({ repoRoot: '/repo' })).rejects.toStrictEqual(
        new GitNotInstalledError(
          'git rev-parse --is-inside-work-tree could not start in /repo: "git" never started: ENOENT: open \'git\'',
        ),
      );
    });
  });

  describe('only main present', () => {
    it('VALID: {repoRoot: "/repo"} only long-lived branch is "main" => returns candidates ["main"] preselected "main"', async () => {
      const proxy = gitDetectStableBranchBrokerProxy();
      proxy.insideWith({ branchListStdout: '* main\n' });

      const result = await gitDetectStableBranchBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual({
        hasGitRepo: true,
        candidates: ['main'],
        preselected: 'main',
      });
    });
  });

  describe('neither main nor master present', () => {
    it('EDGE: {repoRoot: "/repo"} neither main nor master exist => returns candidates [] with no preselected key', async () => {
      const proxy = gitDetectStableBranchBrokerProxy();
      proxy.insideNoMainMaster();

      const result = await gitDetectStableBranchBroker({ repoRoot: '/repo' });

      expect(result).toStrictEqual({ hasGitRepo: true, candidates: [] });
    });
  });
});
