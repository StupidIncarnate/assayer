import { npmRunProxy } from '../npm-run/npm-run.proxy';
import type { ArgMatcher } from '../../gateway-test-support/arg-matcher';

const WORKSPACE_PREFIX = '--workspace=';
const BUILD_ARGS = ['run', 'build'];

// `workspace` reaches argv only after being embedded in `--workspace=${workspace}`, so a tolerant
// address is a predicate over the assembled element. It strips the fixed prefix before handing the
// rest to the caller's own predicate.
const workspaceArg = (workspace: ArgMatcher): ArgMatcher => {
  if (typeof workspace === 'function') {
    return (value: unknown): boolean =>
      typeof value === 'string' &&
      value.startsWith(WORKSPACE_PREFIX) &&
      workspace(value.slice(WORKSPACE_PREFIX.length));
  }

  return `${WORKSPACE_PREFIX}${workspace}`;
};

// Leaving `workspace` out addresses the root call: `npm run build` with no workspace argument.
const exactArgs = ({ workspace }: { workspace: string | undefined }): string[] =>
  workspace === undefined ? BUILD_ARGS : [...BUILD_ARGS, `${WORKSPACE_PREFIX}${workspace}`];

export const runBuildProxy = (): {
  setupResult: (params: { workspace?: string; exitCode: number; output: string }) => void;
  setupNotFound: (params: { workspace?: string }) => void;
  returnsMatchingWorkspace: (params: {
    workspace: ArgMatcher;
    exitCode: number;
    output: string;
  }) => void;
  getCallsFor: (params: { workspace?: ArgMatcher }) => readonly unknown[][];
} => {
  const runProxy = npmRunProxy();

  return {
    setupResult: ({
      workspace,
      exitCode,
      output,
    }: {
      workspace?: string;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.setupResult({ args: exactArgs({ workspace }), exitCode, output });
    },

    setupNotFound: ({ workspace }: { workspace?: string }): void => {
      runProxy.setupNotFound({ args: exactArgs({ workspace }) });
    },

    returnsMatchingWorkspace: ({
      workspace,
      exitCode,
      output,
    }: {
      workspace: ArgMatcher;
      exitCode: number;
      output: string;
    }): void => {
      runProxy.returnsMatchingArgs({
        args: [...BUILD_ARGS, workspaceArg(workspace)],
        exitCode,
        output,
      });
    },

    getCallsFor: ({ workspace }: { workspace?: ArgMatcher }): readonly unknown[][] =>
      runProxy.getCallsFor({
        args: workspace === undefined ? BUILD_ARGS : [...BUILD_ARGS, workspaceArg(workspace)],
      }),
  };
};
