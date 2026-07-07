/**
 * PURPOSE: Boots the Electron main process — hands the boot adapter the status channel and a
 *   status resolver bound to the target repo path.
 *
 * USAGE:
 * await DesktopMainBootResponder({ repoPath });
 * // Opens the window and registers the status IPC; returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';

import { electronDesktopBootAdapter } from '../../../adapters/electron/desktop-boot/electron-desktop-boot-adapter';
import { statusResolveBroker } from '../../../brokers/status/resolve/status-resolve-broker';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const DesktopMainBootResponder = async ({
  repoPath,
}: {
  repoPath: RepoPath;
}): Promise<AdapterResult> =>
  electronDesktopBootAdapter({
    statusChannel: desktopBridgeStatics.channels.status,
    resolveStatus: () => statusResolveBroker({ repoPath }),
  });
