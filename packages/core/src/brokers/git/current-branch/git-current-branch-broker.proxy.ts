import { gitExecAdapterProxy } from '../../../adapters/git/exec/git-exec-adapter.proxy';

export const gitCurrentBranchBrokerProxy = (): {
  onBranch: (params: { name: string }) => void;
  detachedAt: (params: { shortSha: string }) => void;
  notGitRepo: () => void;
} => {
  const gitProxy = gitExecAdapterProxy();

  return {
    onBranch: ({ name }: { name: string }): void => {
      gitProxy.succeeds({ stdout: `${name}\n` });
    },
    detachedAt: ({ shortSha }: { shortSha: string }): void => {
      gitProxy.succeeds({ stdout: 'HEAD\n' });
      gitProxy.succeeds({ stdout: `${shortSha}\n` });
    },
    notGitRepo: (): void => {
      gitProxy.fails({ exitCode: 128, stderr: 'fatal: not a git repository' });
    },
  };
};
