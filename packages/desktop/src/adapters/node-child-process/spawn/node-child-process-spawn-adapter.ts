/**
 * PURPOSE: Wraps node:child_process spawn to launch a detached process (the Electron window),
 *   unref'd so the launching CLI can exit independently.
 *
 *   The child's `error` event carries an active listener: an unhandled `error` event on a
 *   ChildProcess throws inside Node's own EventEmitter machinery and crashes the WHOLE process —
 *   the launching CLI, not just the child that failed to start — with a raw internal stack trace
 *   instead of a message naming what went wrong. The listener only ever fires on a spawn failure
 *   (a missing or unrunnable executable); a successful launch never touches it, so the detached,
 *   unref'd child still outlives the CLI exactly as before.
 *
 * USAGE:
 * nodeChildProcessSpawnAdapter({ command: '/usr/bin/electron', args: ['main.js', '--repo', '/repo'] });
 * // Returns { success: true } after spawning; a spawn failure writes to stderr instead of crashing
 */
import { spawn } from 'node:child_process';

export const nodeChildProcessSpawnAdapter = ({
  command,
  args,
}: {
  command: string;
  args: readonly string[];
}): void => {
  const child = spawn(command, [...args], { detached: true, stdio: 'ignore' });

  child.on('error', (error: Error) => {
    process.stderr.write(
      `assayer: failed to launch ${command} (${error.message}). Verify the executable exists and is runnable, then try again.\n`,
    );
  });

  child.unref();

};
