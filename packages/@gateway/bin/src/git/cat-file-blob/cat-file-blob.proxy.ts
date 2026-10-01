import { gitRunProxy } from '../git-run/git-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

export const catFileBlobProxy = (): {
  setupBlob: (params: { sha: string; contents: string }) => void;
  setupFailure: (params: { sha: string; exitCode: number; output: string }) => void;
  setupNotFound: (params: { sha: string }) => void;
  getCallsFor: (params: { sha: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = gitRunProxy();

  return {
    setupBlob: ({ sha, contents }: { sha: string; contents: string }): void => {
      runProxy.setupResult({ args: ['cat-file', 'blob', sha], exitCode: 0, output: contents });
    },

    setupFailure: ({ sha, exitCode, output }: { sha: string; exitCode: number; output: string }): void => {
      runProxy.setupResult({ args: ['cat-file', 'blob', sha], exitCode, output });
    },

    setupNotFound: ({ sha }: { sha: string }): void => {
      runProxy.setupNotFound({ args: ['cat-file', 'blob', sha] });
    },

    getCallsFor: ({ sha }: { sha: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({ args: ['cat-file', 'blob', sha] }),
  };
};
