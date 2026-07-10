/**
 * PURPOSE: Proxy for gitExecAdapter that mocks node:child_process execFile
 *
 * USAGE:
 * const proxy = gitExecAdapterProxy();
 * proxy.succeeds({ stdout: 'abc123\n' });
 */
import { execFile } from 'node:child_process';

import { registerMock } from '@dungeonmaster/testing/register-mock';

export const gitExecAdapterProxy = (): {
  succeeds: (params: { stdout: string }) => void;
  fails: (params: { exitCode: number; stderr: string }) => void;
  spawnFails: () => void;
} => {
  const handle = registerMock({ fn: execFile });

  return {
    succeeds: ({ stdout }: { stdout: string }): void => {
      handle.mockImplementationOnce((...callArgs: unknown[]): unknown => {
        const callback = callArgs[callArgs.length - 1] as (
          error: unknown,
          stdout: string,
          stderr: string,
        ) => void;

        callback(null, stdout, '');

        return undefined;
      });
    },
    fails: ({ exitCode, stderr }: { exitCode: number; stderr: string }): void => {
      handle.mockImplementationOnce((...callArgs: unknown[]): unknown => {
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
    spawnFails: (): void => {
      handle.mockImplementationOnce((...callArgs: unknown[]): unknown => {
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
