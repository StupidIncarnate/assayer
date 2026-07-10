import { gitExecAdapterProxy } from '../../../adapters/git/exec/git-exec-adapter.proxy';

export const gitLsTreeBrokerProxy = (): {
  returnsTree: (params: { stdout: string }) => void;
} => {
  const execProxy = gitExecAdapterProxy();

  return {
    returnsTree: ({ stdout }: { stdout: string }): void => {
      execProxy.succeeds({ stdout });
    },
  };
};
