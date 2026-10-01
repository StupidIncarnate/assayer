import { gitRunProxy } from '#gateway/bin/git/git-run/git-run.proxy';
import { GitNotInstalledErrorProxy } from '#gateway/bin/git/git-run/git-not-installed.error.proxy';
import { resolveRefProxy } from '#gateway/bin/git/resolve-ref/resolve-ref.proxy';

const BRANCH_ARGS = ['rev-parse', '--abbrev-ref', 'HEAD'];

export const gitCurrentBranchBrokerProxy = (): {
  onBranch: (params: { name: string }) => void;
  detachedAt: (params: { shortSha: string }) => void;
  notGitRepo: () => void;
  gitNotInstalled: () => void;
} => {
  const gitProxy = gitRunProxy();
  const shortShaProxy = resolveRefProxy();
  GitNotInstalledErrorProxy();

  return {
    onBranch: ({ name }: { name: string }): void => {
      gitProxy.setupResult({ args: BRANCH_ARGS, exitCode: 0, output: `${name}\n` });
    },
    detachedAt: ({ shortSha }: { shortSha: string }): void => {
      gitProxy.setupResult({ args: BRANCH_ARGS, exitCode: 0, output: 'HEAD\n' });
      shortShaProxy.setupResolves({ ref: 'HEAD', short: true, sha: shortSha });
    },
    notGitRepo: (): void => {
      gitProxy.setupResult({
        args: BRANCH_ARGS,
        exitCode: 128,
        output: 'fatal: not a git repository',
      });
    },
    gitNotInstalled: (): void => {
      gitProxy.setupNotFound({ args: BRANCH_ARGS });
    },
  };
};
