import { gitResolveCommitBrokerProxy } from '../../git/resolve-commit/git-resolve-commit-broker.proxy';
import { gitLsTreeBrokerProxy } from '../../git/ls-tree/git-ls-tree-broker.proxy';
import { gitCatFileBrokerProxy } from '../../git/cat-file/git-cat-file-broker.proxy';

export const compilePlanStableBrokerProxy = (): {
  resolvesUnchanged: (params: { sha: string }) => void;
  resolvesChanged: (params: { sha: string; lsTreeStdout: string; fileContents: readonly string[] }) => void;
  resolvesChangedCommitUnresolvable: (params: { lsTreeStdout: string; fileContents: readonly string[] }) => void;
} => {
  const resolveCommitProxy = gitResolveCommitBrokerProxy();
  const lsTreeProxy = gitLsTreeBrokerProxy();
  const catFileProxy = gitCatFileBrokerProxy();

  return {
    resolvesUnchanged: ({ sha }: { sha: string }): void => {
      resolveCommitProxy.resolvesTo({ sha });
    },
    resolvesChanged: ({
      sha,
      lsTreeStdout,
      fileContents,
    }: {
      sha: string;
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      resolveCommitProxy.resolvesTo({ sha });
      lsTreeProxy.returnsTree({ stdout: lsTreeStdout });
      fileContents.forEach((content) => {
        catFileProxy.hasBlob({ content });
      });
    },
    resolvesChangedCommitUnresolvable: ({
      lsTreeStdout,
      fileContents,
    }: {
      lsTreeStdout: string;
      fileContents: readonly string[];
    }): void => {
      resolveCommitProxy.refMissing();
      lsTreeProxy.returnsTree({ stdout: lsTreeStdout });
      fileContents.forEach((content) => {
        catFileProxy.hasBlob({ content });
      });
    },
  };
};
