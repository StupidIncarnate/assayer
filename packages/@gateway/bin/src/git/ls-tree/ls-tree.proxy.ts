import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const lsTreeProxy = (): {
  setupTree: (params: { ref: string; output: string; stderr?: string }) => void;
  setupFailure: (params: { ref: string; exitCode: number; output: string }) => void;
  setupNotFound: (params: { ref: string }) => void;
  getCallsFor: (params: { ref: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    // `output` is git's own text, one `<mode> <type> <sha>\t<path>` line per entry.
    setupTree: ({ ref, output, stderr }: { ref: string; output: string; stderr?: string }): void => {
      runProxy.setupResult({ args: ['ls-tree', '-r', ref], exitCode: 0, output, ...(stderr === undefined ? {} : { stderr }) });
    },

    setupFailure: ({ ref, exitCode, output }: { ref: string; exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['ls-tree', '-r', ref], exitCode, output });
    },

    setupNotFound: ({ ref }: { ref: string }): void => {
      runProxy.setupNotFound({ args: ['ls-tree', '-r', ref] });
    },

    getCallsFor: ({ ref }: { ref: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['ls-tree', '-r', ref] }),
  };
};
