import { gitExecAdapterProxy } from '../../../adapters/git/exec/git-exec-adapter.proxy';

export const gitDetectStableBranchBrokerProxy = (): {
  notGitRepo: () => void;
  insideWith: (params: { branchListStdout: string }) => void;
  insideNoMainMaster: () => void;
} => {
  const gitProxy = gitExecAdapterProxy();

  return {
    notGitRepo: (): void => {
      gitProxy.fails({ exitCode: 128, stderr: 'fatal: not a git repository' });
    },
    insideWith: ({ branchListStdout }: { branchListStdout: string }): void => {
      gitProxy.succeeds({ stdout: 'true\n' });
      gitProxy.succeeds({ stdout: branchListStdout });
    },
    insideNoMainMaster: (): void => {
      gitProxy.succeeds({ stdout: 'true\n' });
      gitProxy.succeeds({ stdout: '' });
    },
  };
};
