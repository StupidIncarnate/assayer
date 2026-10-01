/**
 * PURPOSE: Launches a program from a command and an argument list, detached and with every stdio
 * stream ignored, then lets go of it. A caller reaches for this to start a long-lived program (a
 * desktop window) and exit while that program keeps running. Reach for it over `spawnDetached`
 * when nothing comes back to the caller: no pid, no log file descriptor, no working directory.
 * Reach for it over `runFireAndForget` when the program and its arguments are separate values that
 * must reach the program exactly as given, never through a shell that would re-split them.
 *
 * USAGE:
 * spawnFireAndForget({
 *   command: '/usr/bin/electron',
 *   args: ['main.js', '--repo', '/repo'],
 *   onStartFailure: (error) => process.stderr.write(`could not launch: ${error.message}\n`),
 * });
 * // Returns nothing. A program that never starts reaches onStartFailure with Node's own error.
 *
 * `unref()` lets the parent's event loop end while the child lives on. `detached: true` puts the
 * child in its own process group, so a Ctrl-C in the parent's terminal does not reach it.
 *
 * A program that never starts (ENOENT, EACCES) gets no pid, and Node reports the reason only
 * later, through the child's `'error'` event. With no listener on that event, Node crashes the
 * whole parent process. This wrapper always listens, and hands the error to `onStartFailure`. The
 * callback is required because only the caller knows what its user should read.
 */
import { spawn } from 'child_process';

export const spawnFireAndForget = ({
  command,
  args,
  onStartFailure,
}: {
  command: string;
  args: string[];
  onStartFailure: (error: Error) => void;
}): void => {
  const child = spawn(command, args, { detached: true, stdio: 'ignore' });

  child.on('error', (error: Error) => {
    onStartFailure(error);
  });

  child.unref();
};
