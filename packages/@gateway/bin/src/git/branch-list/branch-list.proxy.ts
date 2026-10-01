import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const branchListProxy = (): {
  setupBranches: (params: { patterns: readonly string[]; output: string }) => void;
  setupFailure: (params: { patterns: readonly string[]; exitCode: number; output: string }) => void;
  setupNotFound: (params: { patterns: readonly string[] }) => void;
  getCallsFor: (params: { patterns: readonly ArgMatcher[] }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    // `output` is git's own text, marker column included, such as '* main\n  master\n'.
    setupBranches: ({ patterns, output }: { patterns: readonly string[]; output: string }): void => {
      runProxy.setupResult({ args: ['branch', '--list', ...patterns], exitCode: 0, output });
    },

    setupFailure: ({
      patterns,
      exitCode,
      output,
    }: {
      patterns: readonly string[];
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: ['branch', '--list', ...patterns], exitCode, output });
    },

    setupNotFound: ({ patterns }: { patterns: readonly string[] }): void => {
      runProxy.setupNotFound({ args: ['branch', '--list', ...patterns] });
    },

    getCallsFor: ({ patterns }: { patterns: readonly ArgMatcher[] }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['branch', '--list', ...patterns] }),
  };
};
