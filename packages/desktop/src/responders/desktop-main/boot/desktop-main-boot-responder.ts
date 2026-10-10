/**
 * PURPOSE: Boots the Electron main process — hands the boot adapter every channel plus resolvers
 *   bound to the target repo path. Validates each IPC's raw relPath argument through the compiled-file view's relPath
 *   contract before calling a broker, on the compiled-file, run, saved-run and saved-console channels.
 *
 *   `savedRun` and `savedConsole` never execute anything. Opening a file must not start a Jest run, so
 *   asking what a file's last run said and asking to run it are separate channels, not one lazy
 *   accessor. Both are keyed on the file's CURRENT bytes, so an edited file finds neither — the panel
 *   empties itself on an edit rather than showing a verdict and a report about code that is gone.
 *
 * USAGE:
 * await DesktopMainBootResponder({ repoPath });
 * // Opens the window and registers the status, tree, file, stubs, run, saved-run and saved-console IPC
 */
import { runConsoleFindBroker, runFindBroker } from '@assayer/core/brokers';
import { compiledFileViewContract } from '@assayer/shared/contracts';

import { desktopBootBroker } from '../../../brokers/desktop/boot/desktop-boot-broker';
import { statusResolveBroker } from '../../../brokers/status/resolve/status-resolve-broker';
import { compiledTreeResolveBroker } from '../../../brokers/compiled-tree/resolve/compiled-tree-resolve-broker';
import { compiledFileResolveBroker } from '../../../brokers/compiled-file/resolve/compiled-file-resolve-broker';
import { stubIndexResolveBroker } from '../../../brokers/stub-index/resolve/stub-index-resolve-broker';
import { repoSourceRootBroker } from '../../../brokers/repo/source-root/repo-source-root-broker';
import { runExecuteBroker } from '../../../brokers/run/execute/run-execute-broker';
import { desktopBridgeStatics } from '../../../statics/desktop-bridge/desktop-bridge-statics';

export const DesktopMainBootResponder = async ({
  repoPath,
}: {
  repoPath: string;
}): Promise<void> =>
  desktopBootBroker({
    repoPath,
    statusChannel: desktopBridgeStatics.channels.status,
    compiledTreeChannel: desktopBridgeStatics.channels.compiledTree,
    compiledFileChannel: desktopBridgeStatics.channels.compiledFile,
    stubsChannel: desktopBridgeStatics.channels.stubs,
    runChannel: desktopBridgeStatics.channels.run,
    savedRunChannel: desktopBridgeStatics.channels.savedRun,
    savedConsoleChannel: desktopBridgeStatics.channels.savedConsole,
    runOutputChannel: desktopBridgeStatics.channels.runOutput,
    resolveStatus: async () => statusResolveBroker({ repoPath }),
    resolveCompiledTree: async () => compiledTreeResolveBroker({ repoPath }),
    resolveCompiledFile: async ({ relPath }) =>
      compiledFileResolveBroker({
        repoPath,
        relPath: compiledFileViewContract.shape.relPath.parse(relPath),
      }),
    resolveStubs: async () => stubIndexResolveBroker({ repoPath }),
    resolveRun: async ({ relPath, onOutput }) => {
      const validRelPath = compiledFileViewContract.shape.relPath.parse(relPath);

      return runExecuteBroker({
        repoPath,
        root: await repoSourceRootBroker({ repoPath }),
        relPath: validRelPath,
        onOutput,
      });
    },
    resolveSavedRun: async ({ relPath }) => {
      const validRelPath = compiledFileViewContract.shape.relPath.parse(relPath);

      return runFindBroker({
        configDir: repoPath,
        root: await repoSourceRootBroker({ repoPath }),
        relPath: validRelPath,
      });
    },
    resolveSavedConsole: async ({ relPath }) => {
      const validRelPath = compiledFileViewContract.shape.relPath.parse(relPath);

      return runConsoleFindBroker({
        configDir: repoPath,
        root: await repoSourceRootBroker({ repoPath }),
        relPath: validRelPath,
      });
    },
  });
