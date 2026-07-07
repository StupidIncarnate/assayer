/**
 * PURPOSE: Resolves the desktop status payload — combines core's status with the target repo
 *   path into the DesktopStatus the renderer validates. Backs the `assayer:status` IPC handler.
 *
 * USAGE:
 * statusResolveBroker({ repoPath });
 * // Returns DesktopStatus { version, message, repoPath }
 */
import { statusGetBroker } from '@assayer/core/brokers';

import { desktopStatusContract } from '../../../contracts/desktop-status/desktop-status-contract';
import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const statusResolveBroker = ({ repoPath }: { repoPath: RepoPath }): DesktopStatus => {
  const status = statusGetBroker();

  return desktopStatusContract.parse({
    version: status.version,
    message: status.message,
    repoPath,
  });
};
