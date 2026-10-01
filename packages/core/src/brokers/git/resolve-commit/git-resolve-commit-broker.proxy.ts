import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';
import { resolveRefProxy } from '#gateway/bin/git/resolve-ref/resolve-ref.proxy';

export const gitResolveCommitBrokerProxy = (): {
  resolvesTo: (params: { ref: string; sha: string }) => void;
  refMissing: (params: { ref: string }) => void;
  gitNotInstalled: (params: { ref: string }) => void;
} => {
  GitNotInstalledErrorProxy();
  const refProxy = resolveRefProxy();

  return {
    resolvesTo: ({ ref, sha }: { ref: string; sha: string }): void => {
      refProxy.setupResolves({ ref, sha });
    },
    refMissing: ({ ref }: { ref: string }): void => {
      refProxy.setupMissing({
        ref,
        output: `fatal: ambiguous argument '${ref}': unknown revision or path not in the working tree.\n`,
      });
    },
    gitNotInstalled: ({ ref }: { ref: string }): void => {
      refProxy.setupNotFound({ ref });
    },
  };
};
