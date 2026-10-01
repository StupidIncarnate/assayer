/**
 * PURPOSE: Runs one file's derived cases via the preload bridge adapter. Atomic broker — the seam a
 *   Run button calls.
 *
 * USAGE:
 * await runExecuteBroker({ relPath });
 * // Returns the RunResult the CLI just produced and saved
 */
import type { RunResult, RelPath } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { runResultContract } from '@assayer/shared/contracts';

export const runExecuteBroker = async ({ relPath }: { relPath: RelPath }): Promise<RunResult> => {
  const bridge = window.assayerBridge;

  if (bridge?.runFile === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.runFile({ relPath: String(relPath) });

  return runResultContract.parse(raw);
};
