import { lsTreeProxy } from '#gateway/bin/git/ls-tree/ls-tree.proxy';

export const gitLsTreeBrokerProxy = (): {
  returnsTree: (params: { ref: string; stdout: string }) => void;
  gitNotInstalled: (params: { ref: string }) => void;
} => {
  const treeProxy = lsTreeProxy();

  return {
    returnsTree: ({ ref, stdout }: { ref: string; stdout: string }): void => {
      treeProxy.setupTree({ ref, output: stdout });
    },
    gitNotInstalled: ({ ref }: { ref: string }): void => {
      treeProxy.setupNotFound({ ref });
    },
  };
};
