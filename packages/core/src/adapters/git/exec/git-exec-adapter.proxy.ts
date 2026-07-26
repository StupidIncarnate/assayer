/**
 * PURPOSE: Proxy for gitExecAdapter that mocks node:child_process execFile
 *
 * USAGE:
 * const proxy = gitExecAdapterProxy();
 * proxy.succeeds({ stdout: 'abc123\n' });
 * proxy.succeeds({ stdout: 'true\n', args: ['rev-parse'] }); // matches a specific git subcommand
 */
import { execFile } from 'node:child_process';

import { registerMock } from '@dungeonmaster/testing/register-mock';

// Matches an execFile('git', argv, options, callback) call on a PREFIX of argv, so a caller can
// describe as little as the subcommand ('rev-parse') or as much as it needs to tell two calls to the
// same subcommand apart ('rev-parse', '--short'). Omitted entirely, it matches any git invocation —
// the shape every current single-call site relies on. Typed `unknown[]` rather than `string[]` so the
// caller's literal array (e.g. `['rev-parse']`) is accepted without a new branded contract for one
// test-only matcher.
const gitCallMatcher = (argsPrefix: readonly unknown[] | undefined): readonly unknown[] =>
  argsPrefix === undefined
    ? []
    : [
        'git',
        (actualArgs: unknown): boolean =>
          Array.isArray(actualArgs) && argsPrefix.every((token, index) => actualArgs[index] === token),
      ];

export const gitExecAdapterProxy = (): {
  succeeds: (params: { stdout: string; args?: readonly unknown[] }) => void;
  fails: (params: { exitCode: number; stderr: string; args?: readonly unknown[] }) => void;
  spawnFails: (params?: { args?: readonly unknown[] }) => void;
} => {
  const handle = registerMock({ fn: execFile });

  return {
    succeeds: ({ stdout, args }: { stdout: string; args?: readonly unknown[] }): void => {
      handle.onceFor(gitCallMatcher(args)).implement((...callArgs: unknown[]): unknown => {
        const callback = callArgs[callArgs.length - 1] as (
          error: unknown,
          stdout: string,
          stderr: string,
        ) => void;

        callback(null, stdout, '');

        return undefined;
      });
    },
    fails: ({ exitCode, stderr, args }: { exitCode: number; stderr: string; args?: readonly unknown[] }): void => {
      handle.onceFor(gitCallMatcher(args)).implement((...callArgs: unknown[]): unknown => {
        const callback = callArgs[callArgs.length - 1] as (
          error: unknown,
          stdout: string,
          stderr: string,
        ) => void;
        const error = Object.assign(new Error('git exited non-zero'), { code: exitCode });

        callback(error, '', stderr);

        return undefined;
      });
    },
    spawnFails: ({ args }: { args?: readonly unknown[] } = {}): void => {
      handle.onceFor(gitCallMatcher(args)).implement((...callArgs: unknown[]): unknown => {
        const callback = callArgs[callArgs.length - 1] as (
          error: unknown,
          stdout: string,
          stderr: string,
        ) => void;
        const error = Object.assign(new Error('spawn git ENOENT'), { code: 'ENOENT' });

        callback(error, '', '');

        return undefined;
      });
    },
  };
};
