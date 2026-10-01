/**
 * PURPOSE: The ENOENT error Node's `spawn` emits for a program that does not exist, held as data so
 * a proxy can stage a start failure without spawning anything. Its test spawns a missing program
 * for real and asserts this stub matches that error field for field, so the shape cannot drift
 * from what Node actually emits.
 *
 * USAGE:
 * const error = SpawnNotFoundRecordedErrorStub({ command: '/usr/bin/electron', args: ['main.js'] });
 * // Returns { message: 'spawn /usr/bin/electron ENOENT', errno: -2, code: 'ENOENT',
 * //   syscall: 'spawn /usr/bin/electron', path: '/usr/bin/electron', spawnargs: ['main.js'] }
 */
import { constants } from 'os';

export const SpawnNotFoundRecordedErrorStub = ({
  command,
  args,
}: {
  command: string;
  args: string[];
}): NodeJS.ErrnoException & { spawnargs: string[] } =>
  Object.assign(new Error(`spawn ${command} ENOENT`), {
    errno: -constants.errno.ENOENT,
    code: 'ENOENT',
    syscall: `spawn ${command}`,
    path: command,
    spawnargs: [...args],
  });
