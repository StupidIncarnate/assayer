/**
 * PURPOSE: Fetches a file's LAST saved run via the preload bridge adapter. Atomic broker — the seam
 *   the detail panel calls when a file is opened.
 *
 *   It never runs anything, which is the whole distinction from `run-execute-broker`.
 *
 * USAGE:
 * await runFetchSavedBroker({ relPath });
 * // Returns the saved RunResult, or undefined when the file has never been run
 */
import type { RunResult } from '@assayer/shared/contracts';
import { window } from '#gateway/browser/window';
import { preloadBridgeStatics } from '../../../statics/preload-bridge/preload-bridge-statics';
import { runResultContract } from '@assayer/shared/contracts';

export const runFetchSavedBroker = async ({ relPath }: { relPath: string }): Promise<RunResult | undefined> => {
  const bridge = window.assayerBridge;

  if (bridge?.getSavedRun === undefined) {
    throw new Error(preloadBridgeStatics.unavailableMessage);
  }

  const raw: unknown = await bridge.getSavedRun({ relPath: String(relPath) });

  return raw === undefined || raw === null ? undefined : runResultContract.parse(raw);
};
