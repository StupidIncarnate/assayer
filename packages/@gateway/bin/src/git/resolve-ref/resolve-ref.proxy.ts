import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const resolveRefProxy = (): {
  setupResolves: (params: { ref: string; short?: boolean; sha: string; stderr?: string }) => void;
  setupMissing: (params: { ref: string; short?: boolean; output: string }) => void;
  setupNotFound: (params: { ref: string; short?: boolean }) => void;
  getCallsFor: (params: { ref: ArgMatcher; short?: boolean }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupResolves: ({
      ref,
      short,
      sha,
      stderr,
    }: {
      ref: string;
      short?: boolean;
      sha: string;
      stderr?: string;
    }): void => {
      runProxy.setupResult({
        args: short === true ? ['rev-parse', '--short', ref] : ['rev-parse', ref],
        exitCode: 0,
        output: `${sha}\n`,
        ...(stderr === undefined ? {} : { stderr }),
      });
    },

    // Git's own answer for a ref it cannot find: exit code 128, with its message as the output.
    setupMissing: ({ ref, short, output }: { ref: string; short?: boolean; output: string }): void => {
      runProxy.setupResult({
        args: short === true ? ['rev-parse', '--short', ref] : ['rev-parse', ref],
        exitCode: 128,
        output,
      });
    },

    setupNotFound: ({ ref, short }: { ref: string; short?: boolean }): void => {
      runProxy.setupNotFound({
        args: short === true ? ['rev-parse', '--short', ref] : ['rev-parse', ref],
      });
    },

    getCallsFor: ({ ref, short }: { ref: ArgMatcher; short?: boolean }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: short === true ? ['rev-parse', '--short', ref] : ['rev-parse', ref],
      }),
  };
};
