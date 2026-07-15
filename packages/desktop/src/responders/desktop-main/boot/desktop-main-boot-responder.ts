/**
 * PURPOSE: Boots the Electron main process — hands the boot adapter every channel plus resolvers
 *   bound to the target repo path. Validates each IPC's raw relPath argument through relPathContract
 *   before calling a broker.
 *
 *   `savedRun` never executes anything. Opening a file must not start a Jest run, so asking what a
 *   file's last run said and asking to run it are two channels, not one lazy accessor.
 *
 * USAGE:
 * await DesktopMainBootResponder({ repoPath });
 * // Opens the window and registers the status/tree/file/run/saved-run IPC; returns { success: true }
 */
import type { AdapterResult } from '@dungeonmaster/shared/contracts';
import { relPathContract } from '@assayer/shared/contracts';
import { runFindBroker } from '@assayer/core/brokers';

import { electronDesktopBootAdapter } from '../../../adapters/electron/desktop-boot/electron-desktop-boot-adapter';
import { statusResolveBroker } from '../../../brokers/status/resolve/status-resolve-broker';
import { compiledTreeResolveBroker } from '../../../brokers/compiled-tree/resolve/compiled-tree-resolve-broker';
import { compiledFileResolveBroker } from '../../../brokers/compiled-file/resolve/compiled-file-resolve-broker';
import { repoSourceRootBroker } from '../../../brokers/repo/source-root/repo-source-root-broker';
import { runExecuteBroker } from '../../../brokers/run/execute/run-execute-broker';
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
    runChannel: desktopBridgeStatics.channels.run,
    savedRunChannel: desktopBridgeStatics.channels.savedRun,
    resolveStatus: () => statusResolveBroker({ repoPath }),
    resolveCompiledTree: async () => compiledTreeResolveBroker({ repoPath }),
    resolveCompiledFile: async ({ relPath }) =>
      compiledFileResolveBroker({ repoPath, relPath: relPathContract.parse(relPath) }),
    resolveRun: async ({ relPath }) =>
      runExecuteBroker({
        repoPath: String(repoPath),
        root: String(await repoSourceRootBroker({ repoPath })),
        relPath: String(relPathContract.parse(relPath)),
      }),
    resolveSavedRun: async ({ relPath }) =>
      runFindBroker({
        configDir: String(repoPath),
        root: String(await repoSourceRootBroker({ repoPath })),
        relPath: String(relPathContract.parse(relPath)),
      }),
  });
