/**
 * PURPOSE: Handles the `assayer:status` IPC channel — combines core's status with the target
 *   repo path into the desktop status payload the renderer validates.
 *
 * USAGE:
 * StatusIpcResponder({ repoPath });
 * // Returns DesktopStatus { version, message, repoPath }
 */
import { assayerCoreStatusAdapter } from '../../../adapters/assayer-core/status/assayer-core-status-adapter';
import { desktopStatusContract } from '../../../contracts/desktop-status/desktop-status-contract';
import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const StatusIpcResponder = ({ repoPath }: { repoPath: RepoPath }): DesktopStatus => {
  const status = assayerCoreStatusAdapter();

  return desktopStatusContract.parse({
    version: status.version,
    message: status.message,
    repoPath,
  });
};
