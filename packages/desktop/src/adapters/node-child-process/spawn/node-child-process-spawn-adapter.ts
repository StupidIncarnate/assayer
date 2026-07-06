/**
 * PURPOSE: Wraps node:child_process spawn to launch a detached process (the Electron window),
 *   unref'd so the launching CLI can exit independently.
 *
 * USAGE:
 * nodeChildProcessSpawnAdapter({ command: '/usr/bin/electron', args: ['main.js', '--repo', '/repo'] });
 * // Returns { success: true } after spawning
 */
import { spawn } from 'node:child_process';
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

export const nodeChildProcessSpawnAdapter = ({
  command,
  args,
}: {
  command: string;
  args: readonly string[];
}): AdapterResult => {
  const child = spawn(command, [...args], { detached: true, stdio: 'ignore' });
  child.unref();

  return { success: true as const };
};
