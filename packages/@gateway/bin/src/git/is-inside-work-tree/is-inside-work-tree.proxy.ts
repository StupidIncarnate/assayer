import { gitRunProxy } from '../git-run/git-run.proxy';

const ARGS = ['rev-parse', '--is-inside-work-tree'];

export const isInsideWorkTreeProxy = (): {
  setupInside: () => void;
  setupInsideGitDir: () => void;
  setupNotRepo: () => void;
  setupNotFound: () => void;
  getCallsFor: () => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupInside: (): void => {
      runProxy.setupResult({ args: ARGS, exitCode: 0, output: 'true\n' });
    },
    // Inside a repository's `.git` directory, git exits 0 but prints `false`.
    setupInsideGitDir: (): void => {
      runProxy.setupResult({ args: ARGS, exitCode: 0, output: 'false\n' });
    },
    setupNotRepo: (): void => {
      runProxy.setupResult({
        args: ARGS,
        exitCode: 128,
        output: 'fatal: not a git repository (or any of the parent directories): .git\n',
      });
    },
    setupNotFound: (): void => {
      runProxy.setupNotFound({ args: ARGS });
    },

    // No argument to address — args are the fixed ARGS constant.
    getCallsFor: (): readonly unknown[][] => runProxy.getCallsFor({ args: ARGS }),
  };
};
