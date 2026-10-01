/**
 * PURPOSE: Launches the Electron desktop app scoped to a target repo — spawns the Electron
 *   binary with the compiled main entry and `--repo <repoPath>`. Called by the `assayer` CLI's
 *   no-command path.
 *
 * USAGE:
 * desktopLaunchBroker({ repoPath: '/home/user/project' });
 * // Returns { success: true } after spawning the window
 */

import { desktopResolveBinaryBroker } from '../resolve-binary/desktop-resolve-binary-broker';
import { nodeChildProcessSpawnAdapter } from '../../../adapters/node-child-process/spawn/node-child-process-spawn-adapter';
import { join } from '#gateway/node/path';
import { executablePathContract } from '../../../contracts/executable-path/executable-path-contract';

export const desktopLaunchBroker = ({ repoPath }: { repoPath: string }): void => {
  const electronBinary = desktopResolveBinaryBroker();
  const mainEntry = executablePathContract.parse(join(__dirname, '..', '..', '..', '..', 'bin', 'desktop-main.js'));

  return nodeChildProcessSpawnAdapter({
    command: electronBinary,
    args: [mainEntry, '--repo', repoPath],
  });
};
