import { spawn } from 'child_process';
import { registerMock } from '@dungeonmaster/testing/register-mock';
import { ChildProcessStub } from '../child-process/child-process.stub';
import { SpawnNotFoundRecordedErrorStub } from './spawn-not-found-recorded-error.stub';

// `spawn(command, args, options)` is the real call this proxy mocks. `spawnFireAndForget` always
// passes the same options, so a stage addresses by `command` and `args`, the two values a caller
// chooses.
export const spawnFireAndForgetProxy = (): {
  setupLaunch: (params: { command: string; args: readonly string[] }) => void;
  setupNotFound: (params: { command: string; args: readonly string[] }) => void;
  // Every call's full `[command, args, options]` tuple for this command, in call order.
  getCallsFor: (params: { command: string }) => readonly unknown[][];
  // How many times the launched child for this command was unref'd, summed over every launch.
  getUnrefCountFor: (params: { command: string }) => number;
} => {
  const handle = registerMock({ fn: spawn });
  const unrefCountByCommand = new Map<string, number>();

  const buildChild = ({ command }: { command: string }): ReturnType<typeof ChildProcessStub> => {
    const child = ChildProcessStub();
    unrefCountByCommand.set(command, unrefCountByCommand.get(command) ?? 0);
    child.unref = (): void => {
      unrefCountByCommand.set(command, (unrefCountByCommand.get(command) ?? 0) + 1);
    };
    return child;
  };

  return {
    setupLaunch: ({ command, args }: { command: string; args: readonly string[] }): void => {
      handle.calledWith([command, args]).implement(() => buildChild({ command }));
    },

    // Node emits a start failure on the next tick, after `spawn` has already returned, so a test
    // awaits one tick before it reads what `onStartFailure` received.
    setupNotFound: ({ command, args }: { command: string; args: readonly string[] }): void => {
      handle.calledWith([command, args]).implement(() => {
        const child = buildChild({ command });
        process.nextTick(() => {
          child.emit('error', SpawnNotFoundRecordedErrorStub({ command, args: [...args] }));
        });
        return child;
      });
    },

    getCallsFor: ({ command }: { command: string }): readonly unknown[][] =>
      handle.callsMatching([command]),

    getUnrefCountFor: ({ command }: { command: string }): number =>
      unrefCountByCommand.get(command) ?? 0,
  };
};
