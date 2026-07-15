/**
 * PURPOSE: Reads a file's LAST saved run over the preload contextBridge (window.assayerBridge) and
 *   validates the raw IPC payload into the shared RunResult contract.
 *
 *   It never runs anything — opening a file must not start a Jest run — and it returns undefined for
 *   a file that has not been run, which is an answer the UI renders as an empty state rather than an
 *   error.
 *
 * USAGE:
 * await assayerBridgeGetSavedRunAdapter({ relPath });
 * // Returns the validated RunResult, or undefined when the file has never been run
 */
import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const assayerBridgeGetSavedRunAdapter = async ({
  relPath,
}: {
  relPath: RelPath;
}): Promise<RunResult | undefined> => {
  const bridge = window.assayerBridge;

  if (bridge?.getSavedRun === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getSavedRun({ relPath: String(relPath) });

  return raw === undefined || raw === null ? undefined : runResultContract.parse(raw);
};
