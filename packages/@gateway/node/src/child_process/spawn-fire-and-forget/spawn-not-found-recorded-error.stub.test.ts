import { spawn } from 'child_process';
import { SpawnNotFoundRecordedErrorStub } from './spawn-not-found-recorded-error.stub';

// An absolute path under a folder that does not exist, so no PATH lookup can find a real program.
const MISSING_PROGRAM = '/assayer-missing-folder/assayer-missing-program';

describe('SpawnNotFoundRecordedErrorStub', () => {
  it('VALID: {a missing program} => matches the real ENOENT error spawn emits, field for field', async () => {
    const real = await new Promise<NodeJS.ErrnoException & { path?: string; spawnargs?: string[] }>(
      (resolve) => {
        spawn(MISSING_PROGRAM, ['--flag', 'value'], { detached: true, stdio: 'ignore' }).once(
          'error',
          resolve,
        );
      },
    );
    const recorded = SpawnNotFoundRecordedErrorStub({
      command: MISSING_PROGRAM,
      args: ['--flag', 'value'],
    });

    expect({
      message: recorded.message,
      errno: recorded.errno,
      code: recorded.code,
      syscall: recorded.syscall,
      path: recorded.path,
      spawnargs: recorded.spawnargs,
    }).toStrictEqual({
      message: real.message,
      errno: real.errno,
      code: real.code,
      syscall: real.syscall,
      path: real.path,
      spawnargs: real.spawnargs,
    });
  });
});
