import { spawn } from 'node:child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { queueMicrotask } from '#gateway/node/queueMicrotask';
import { Buffer } from '#gateway/node/buffer';

export const nodeChildProcessExecAdapterProxy = (): {
  exitsWith: ({ exitCode, stdout, stderr }: { exitCode: number; stdout: string; stderr: string }) => void;
  getCalls: () => unknown[][];
} => {
  const handle = registerMock({ fn: spawn });
  const state = { exitCode: 0, stdout: '', stderr: '' };

  handle.calledWith([]).implement((): unknown => {
    const listeners: { close?: (code: number | null) => void; error?: (error: Error) => void } = {};

    // The adapter attaches its handlers synchronously, so `close` must fire on a later tick or it
    // would be emitted into a listener that does not exist yet.
    queueMicrotask(() => {
      listeners.close?.(state.exitCode);
    });

    return {
      stdout: {
        on: (_event: string, listener: (chunk: Buffer) => void): void => {
          listener(Buffer.from(state.stdout));
        },
      },
      stderr: {
        on: (_event: string, listener: (chunk: Buffer) => void): void => {
          listener(Buffer.from(state.stderr));
        },
      },
      on: (event: string, listener: (arg: never) => void): void => {
        if (event === 'close') {
          listeners.close = listener as (code: number | null) => void;
        }
      },
    };
  });

  return {
    exitsWith: ({ exitCode, stdout, stderr }: { exitCode: number; stdout: string; stderr: string }): void => {
      state.exitCode = exitCode;
      state.stdout = stdout;
      state.stderr = stderr;
    },
    // Reports every call spawn actually received, in order — the command and args are the thing under
    // test, so filtering by them here would be circular. A test asserts this whole list, so a second,
    // unwanted spawn shows up rather than hiding behind the one the test meant to check.
    getCalls: (): unknown[][] => handle.callsMatching([]).map((call) => call),
  };
};
