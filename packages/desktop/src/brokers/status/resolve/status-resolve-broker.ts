/**
 * PURPOSE: Resolves the desktop status payload — combines core's status with the target repo path and
 *   the repo's display-only `runMode` into the DesktopStatus the renderer validates. Backs the
 *   `assayer:status` IPC handler.
 *
 *   The config is NOT on the desktop serve path — the renderer only ever reads the compiled cache — so
 *   `runMode` rides the status handshake. It is loaded here with core's config brokers rooted at the
 *   desktop repoPath, defaulting to an all-defaults config when none is found or it cannot be read.
 *   `runMode` never touches the cache or the run engine; it only tells the panel which cases to gray.
 *
 * USAGE:
 * await statusResolveBroker({ repoPath });
 * // Returns DesktopStatus { version, message, repoPath, runMode }
 */
import { statusGetBroker, configFindBroker, configLoadBroker } from '@assayer/core/brokers';
import { assayerConfigContract } from '@assayer/shared/contracts';

import { desktopStatusContract } from '../../../contracts/desktop-status/desktop-status-contract';
import type { DesktopStatus } from '../../../contracts/desktop-status/desktop-status-contract';
import type { RepoPath } from '../../../contracts/repo-path/repo-path-contract';

export const statusResolveBroker = async ({ repoPath }: { repoPath: RepoPath }): Promise<DesktopStatus> => {
  const status = statusGetBroker();

  const found = await configFindBroker({ startDir: String(repoPath) });
  const loaded = found.found ? await configLoadBroker({ configPath: String(found.configPath) }) : undefined;
  const config = loaded?.success === true ? loaded.data : assayerConfigContract.parse({});

  return desktopStatusContract.parse({
    version: status.version,
    message: status.message,
    repoPath,
    runMode: config.runMode,
  });
};
