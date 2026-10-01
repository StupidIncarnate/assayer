/**
 * PURPOSE: Launches the Electron desktop app scoped to a target repo — spawns the Electron
 *   binary with the compiled main entry and `--repo <repoPath>`. Called by the `assayer` CLI's
 *   no-command path. A start failure (a missing or unrunnable executable) writes a message to
 *   stderr instead of crashing the launching CLI.
 *
 * USAGE:
 * desktopLaunchBroker({ repoPath: '/home/user/project' });
 * // Returns nothing after spawning the window
 */

import { desktopResolveBinaryBroker } from '../resolve-binary/desktop-resolve-binary-broker';
import { spawnFireAndForget } from '#gateway/node/child_process';
import { join } from '#gateway/node/path';
import { stderr } from '#gateway/node/process';
import { executablePathContract } from '../../../contracts/executable-path/executable-path-contract';

export const desktopLaunchBroker = ({ repoPath }: { repoPath: string }): void => {
  const command = desktopResolveBinaryBroker();
  const mainEntry = executablePathContract.parse(join(__dirname, '..', '..', '..', '..', 'bin', 'desktop-main.js'));
  const args = [mainEntry, '--repo', repoPath];

  spawnFireAndForget({
    command,
    args: [...args],
    onStartFailure: (error) => {
      stderr.write(
        `assayer: failed to launch ${command} (${error.message}). Verify the executable exists and is runnable, then try again.\n`,
      );
    },
  });
};
