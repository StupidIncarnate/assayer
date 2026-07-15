import { spawn } from 'node:child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';

export const nodeChildProcessExecAdapterProxy = (): {
  exitsWith: ({ exitCode, stdout, stderr }: { exitCode: number; stdout: string; stderr: string }) => void;
  getLastCall: () => readonly unknown[] | undefined;
} => {
  const handle = registerMock({ fn: spawn });
  const state = { exitCode: 0, stdout: '', stderr: '' };

  handle.mockImplementation((): unknown => {
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
    getLastCall: (): readonly unknown[] | undefined => handle.mock.calls.at(-1),
  };
};
