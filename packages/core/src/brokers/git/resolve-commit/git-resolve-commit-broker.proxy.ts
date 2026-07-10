import { gitExecAdapterProxy } from '../../../adapters/git/exec/git-exec-adapter.proxy';

export const gitResolveCommitBrokerProxy = (): {
  resolvesTo: (params: { sha: string }) => void;
  refMissing: () => void;
} => {
  const execProxy = gitExecAdapterProxy();

  return {
    resolvesTo: ({ sha }: { sha: string }): void => {
      execProxy.succeeds({ stdout: `${sha}\n` });
    },
    refMissing: (): void => {
      execProxy.fails({
        exitCode: 128,
        stderr: "fatal: ambiguous argument 'does-not-exist': unknown revision or path not in the working tree.\n",
      });
    },
  };
};
