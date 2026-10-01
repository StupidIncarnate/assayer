import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';
import { branchListProxy } from '#gateway/bin/git/branch-list/branch-list.proxy';
import { isInsideWorkTreeProxy } from '#gateway/bin/git/is-inside-work-tree/is-inside-work-tree.proxy';

export const gitDetectStableBranchBrokerProxy = (): {
  notGitRepo: () => void;
  insideWith: (params: { branchListStdout: string }) => void;
  insideNoMainMaster: () => void;
  gitNotInstalled: () => void;
} => {
  GitNotInstalledErrorProxy();
  const insideProxy = isInsideWorkTreeProxy();
  const branchesProxy = branchListProxy();

  return {
    notGitRepo: (): void => {
      insideProxy.setupNotRepo();
    },
    gitNotInstalled: (): void => {
      insideProxy.setupNotFound();
    },
    insideWith: ({ branchListStdout }: { branchListStdout: string }): void => {
      insideProxy.setupInside();
      branchesProxy.setupBranches({ patterns: ['main', 'master'], output: branchListStdout });
    },
    insideNoMainMaster: (): void => {
      insideProxy.setupInside();
      branchesProxy.setupBranches({ patterns: ['main', 'master'], output: '' });
    },
  };
};
