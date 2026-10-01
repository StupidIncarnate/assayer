import { spawn } from 'node:child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { queueMicrotask } from '#gateway/node/queueMicrotask';
import { Buffer } from '#gateway/node/buffer';

export const nodeChildProcessExecAdapterProxy = (): {
  exitsWith: ({
    command,
    args,
    exitCode,
    stdout,
    stderr,
  }: {
    command: string;
    args: readonly string[];
    exitCode: number;
    stdout: string;
    stderr: string;
  }) => void;
  getCalls: () => unknown[][];
} => {
  const handle = registerMock({ fn: spawn });

  return {
    // Stages the one spawn the test expects, by its command and args. The cwd and options are not
    // described, so the adapter's options are read back through getCalls().
    exitsWith: ({ command, args, exitCode, stdout, stderr }): void => {
      handle.calledWith([command, [...args]]).implement((): unknown => {
        const listeners: { close?: (code: number | null) => void; error?: (error: Error) => void } = {};

        // The adapter attaches its handlers synchronously, so `close` must fire on a later tick or it
        // would be emitted into a listener that does not exist yet.
        queueMicrotask(() => {
          listeners.close?.(exitCode);
        });

        return {
          stdout: {
            on: (_event: string, listener: (chunk: Buffer) => void): void => {
              listener(Buffer.from(stdout));
            },
          },
          stderr: {
            on: (_event: string, listener: (chunk: Buffer) => void): void => {
              listener(Buffer.from(stderr));
            },
          },
          on: (event: string, listener: (arg: never) => void): void => {
            if (event === 'close') {
              listeners.close = listener as (code: number | null) => void;
            }
          },
        };
      });
    },
    // Reports every call spawn actually received, in order. A test asserts this whole list, so a
    // second, unwanted spawn shows up rather than hiding behind the one the test meant to check.
    getCalls: (): unknown[][] => handle.callsMatching([]).map((call) => call),
  };
};
