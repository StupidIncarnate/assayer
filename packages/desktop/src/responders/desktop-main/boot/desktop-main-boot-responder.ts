/**
 * PURPOSE: Boots the Electron main process — hands the boot adapter the status, compiled-tree,
 *   and compiled-file channels plus resolvers bound to the target repo path. Validates the
 *   compiled-file IPC's raw relPath argument through relPathContract before calling the broker.
 *
 * USAGE:
 * await DesktopMainBootResponder({ repoPath });
 * // Opens the window and registers the status/compiled-tree/compiled-file IPC; returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { relPathContract } from '@assayer/shared/contracts';

import { electronDesktopBootAdapter } from '../../../adapters/electron/desktop-boot/electron-desktop-boot-adapter';
import { statusResolveBroker } from '../../../brokers/status/resolve/status-resolve-broker';
import { compiledTreeResolveBroker } from '../../../brokers/compiled-tree/resolve/compiled-tree-resolve-broker';
import { compiledFileResolveBroker } from '../../../brokers/compiled-file/resolve/compiled-file-resolve-broker';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const DesktopMainBootResponder = async ({
  repoPath,
}: {
  repoPath: RepoPath;
}): Promise<AdapterResult> =>
  electronDesktopBootAdapter({
    statusChannel: desktopBridgeStatics.channels.status,
    compiledTreeChannel: desktopBridgeStatics.channels.compiledTree,
    compiledFileChannel: desktopBridgeStatics.channels.compiledFile,
    resolveStatus: () => statusResolveBroker({ repoPath }),
    resolveCompiledTree: async () => compiledTreeResolveBroker({ repoPath }),
    resolveCompiledFile: async ({ relPath }) =>
      compiledFileResolveBroker({ repoPath, relPath: relPathContract.parse(relPath) }),
  });
