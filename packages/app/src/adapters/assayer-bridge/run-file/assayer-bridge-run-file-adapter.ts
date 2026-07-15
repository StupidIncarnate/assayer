/**
 * PURPOSE: Runs one file's derived cases over the preload contextBridge (window.assayerBridge) and
 *   validates the raw IPC payload into the shared RunResult contract.
 *
 * USAGE:
 * await assayerBridgeRunFileAdapter({ relPath });
 * // Returns the validated RunResult the CLI just produced
 */
import { runResultContract } from '@assayer/shared/contracts';
import type { RunResult, RelPath } from '@assayer/shared/contracts';

import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';

export const assayerBridgeRunFileAdapter = async ({ relPath }: { relPath: RelPath }): Promise<RunResult> => {
  const bridge = window.assayerBridge;

  if (bridge?.runFile === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.runFile({ relPath: String(relPath) });

  return runResultContract.parse(raw);
};
