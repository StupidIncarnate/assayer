import { gitExecAdapterProxy } from '../../../adapters/git/exec/git-exec-adapter.proxy';

export const gitCatFileBrokerProxy = (): {
  hasBlob: (params: { content: string }) => void;
} => {
  const execProxy = gitExecAdapterProxy();

  return {
    hasBlob: ({ content }: { content: string }): void => {
      execProxy.succeeds({ stdout: content });
    },
  };
};
